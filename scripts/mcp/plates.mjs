#!/usr/bin/env node
/**
 * plates.mjs — local stdio MCP server for generating PointCast poster
 * "plates" (poster art, OG images) with OpenAI's image model, and for
 * shelling out to the Codex CLI when a session needs a second agent to
 * make repo edits.
 *
 * What it is:
 *   A small Model Context Protocol (MCP) server, plain ESM JavaScript,
 *   no build step. It exposes four tools over stdio:
 *     - plate_generate  generate a PNG (+ optional webp / OG crop)
 *     - plate_inspect   read width/height/format/bytes of an image
 *     - plate_list      list images in a public/images/ directory
 *     - codex_exec      run `codex exec` against this repo
 *
 * How to run it directly (mostly for debugging — normally your MCP
 * client spawns this for you):
 *   node scripts/mcp/plates.mjs
 *
 * How a client picks it up:
 *   Claude Code reads the repo-root `.mcp.json` automatically. For
 *   Codex, add a `[mcp_servers.pointcast-plates]` block to
 *   `~/.codex/config.toml` (see scripts/mcp/README.md).
 *
 * Where the OpenAI key lives:
 *   `OPENAI_API_KEY` in the environment, or in a gitignored
 *   `.env.local` file at the repo root (`OPENAI_API_KEY=sk-...`), read
 *   the same way scripts/manus.mjs reads MANUS_API_KEY. The key is
 *   never logged or echoed back in any tool result.
 *
 * Path safety:
 *   Every file this server writes or reads must resolve to a path
 *   inside `public/images/` under the repo root. Anything else is
 *   refused with a clear error — this server does not touch the rest
 *   of the working tree.
 *
 * stdio hygiene:
 *   The MCP stdio transport uses stdout as the wire protocol. This
 *   file must never `console.log` — diagnostics go to `console.error`
 *   (stderr) only.
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Config / paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// scripts/mcp/plates.mjs -> repo root is two levels up.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ENV_FILE = path.join(REPO_ROOT, '.env.local');
const IMAGES_ROOT = path.join(REPO_ROOT, 'public', 'images');
const OPENAI_URL = 'https://api.openai.com/v1/images/generations';

/** Load OPENAI_API_KEY from process.env, falling back to .env.local. */
function loadEnv() {
  if (process.env.OPENAI_API_KEY) return;
  if (fs.existsSync(ENV_FILE)) {
    const raw = fs.readFileSync(ENV_FILE, 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}
loadEnv();

function getApiKey() {
  return process.env.OPENAI_API_KEY || '';
}

/**
 * Resolve a repo-relative path and confirm it lives inside
 * public/images/. Throws with a clear, actionable message otherwise.
 */
function resolveImagePath(relPath, label = 'path') {
  if (typeof relPath !== 'string' || relPath.trim() === '') {
    throw new Error(`${label} is required (repo-relative, under public/images/).`);
  }
  const abs = path.resolve(REPO_ROOT, relPath);
  const rel = path.relative(IMAGES_ROOT, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `${label} "${relPath}" resolves outside public/images/ — refusing. ` +
        `All plate output/input paths must be repo-relative and stay under public/images/.`,
    );
  }
  return abs;
}

const ASPECT_TO_SIZE = {
  portrait: '1024x1536',
  square: '1024x1024',
  landscape: '1536x1024',
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: 'pointcast-plates-mcp-server',
  version: '0.1.0',
});

// --- plate_generate ---------------------------------------------------------

server.registerTool(
  'plate_generate',
  {
    title: 'Generate a poster plate',
    description:
      'Generate a PNG image with OpenAI\'s image model (gpt-image-1) and ' +
      'write it into public/images/ in this repo. Optionally also writes a ' +
      '.webp twin and a 1200x630 center-cropped OG variant. Calls the real ' +
      'OpenAI API (network + OPENAI_API_KEY required) and writes files to disk.',
    inputSchema: {
      prompt: z.string().min(1).describe('Image generation prompt.'),
      out: z
        .string()
        .min(1)
        .describe('Repo-relative output path ending in .png, under public/images/.'),
      aspect: z
        .enum(['portrait', 'square', 'landscape'])
        .default('portrait')
        .describe('portrait=1024x1536, square=1024x1024, landscape=1536x1024'),
      model: z.string().default('gpt-image-1').describe('OpenAI image model.'),
      quality: z.enum(['low', 'medium', 'high']).default('high'),
      webp: z
        .boolean()
        .default(true)
        .describe('Also write a .webp twin (quality 82) alongside the PNG.'),
      og: z
        .string()
        .optional()
        .describe(
          'Optional repo-relative .png path under public/images/ to also write a ' +
            '1200x630 center-cropped OG variant to.',
        ),
    },
    annotations: {
      title: 'Generate a poster plate',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ prompt, out, aspect, model, quality, webp, og }) => {
    // Validate paths first — a bad path should be refused regardless of
    // whether an API key is configured or network is reachable.
    let outAbs;
    let ogAbs;
    try {
      outAbs = resolveImagePath(out, 'out');
      if (!outAbs.toLowerCase().endsWith('.png')) {
        throw new Error(`out "${out}" must end in .png`);
      }
      if (og !== undefined) {
        ogAbs = resolveImagePath(og, 'og');
        if (!ogAbs.toLowerCase().endsWith('.png')) {
          throw new Error(`og "${og}" must end in .png`);
        }
      }
    } catch (err) {
      return errorResult(err.message);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return errorResult(
        `OPENAI_API_KEY is not set. Put it in ${path.relative(REPO_ROOT, ENV_FILE)} ` +
          `(repo root, gitignored) as OPENAI_API_KEY=sk-... or export it in your shell.`,
      );
    }

    const size = ASPECT_TO_SIZE[aspect] ?? ASPECT_TO_SIZE.portrait;

    let res;
    try {
      res = await fetch(OPENAI_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model, prompt, size, quality, n: 1 }),
      });
    } catch (err) {
      return errorResult(
        `Network error calling OpenAI images API: ${err.message}. ` +
          `Check that this machine can reach api.openai.com (a proxy or sandbox egress policy may be blocking it).`,
      );
    }

    const bodyText = await res.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = null;
    }

    if (!res.ok) {
      const apiMessage = body?.error?.message || bodyText.slice(0, 2000);
      return errorResult(`OpenAI images API returned HTTP ${res.status}: ${apiMessage}`);
    }

    const b64 = body?.data?.[0]?.b64_json;
    if (!b64) {
      return errorResult(
        'OpenAI images API response did not include data[0].b64_json — unexpected response shape.',
      );
    }

    const pngBuffer = Buffer.from(b64, 'base64');

    const files = [];
    try {
      await fsp.mkdir(path.dirname(outAbs), { recursive: true });
      await fsp.writeFile(outAbs, pngBuffer);
      files.push({ path: path.relative(REPO_ROOT, outAbs), bytes: pngBuffer.byteLength });

      if (webp) {
        const webpAbs = outAbs.replace(/\.png$/i, '.webp');
        const webpBuffer = await sharp(pngBuffer).webp({ quality: 82 }).toBuffer();
        await fsp.writeFile(webpAbs, webpBuffer);
        files.push({ path: path.relative(REPO_ROOT, webpAbs), bytes: webpBuffer.byteLength });
      }

      if (ogAbs) {
        await fsp.mkdir(path.dirname(ogAbs), { recursive: true });
        const ogBuffer = await sharp(pngBuffer)
          .resize(1200, 630, { fit: 'cover', position: 'centre' })
          .png()
          .toBuffer();
        await fsp.writeFile(ogAbs, ogBuffer);
        files.push({ path: path.relative(REPO_ROOT, ogAbs), bytes: ogBuffer.byteLength });
      }
    } catch (err) {
      return errorResult(`Generated image but failed writing files: ${err.message}`);
    }

    const summary = files.map((f) => `${f.path} (${f.bytes} bytes)`).join('\n  ');
    return {
      content: [
        {
          type: 'text',
          text: `Wrote ${files.length} file(s):\n  ${summary}\nmodel=${model} size=${size} quality=${quality}`,
        },
      ],
      structuredContent: {
        files,
        model,
        size,
        bytes: pngBuffer.byteLength,
      },
    };
  },
);

// --- plate_inspect -----------------------------------------------------------

server.registerTool(
  'plate_inspect',
  {
    title: 'Inspect an image plate',
    description:
      'Read width, height, format, and byte size of an image file under public/images/ via sharp metadata.',
    inputSchema: {
      path: z.string().min(1).describe('Repo-relative image path under public/images/.'),
    },
    annotations: {
      title: 'Inspect an image plate',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ path: relPath }) => {
    let abs;
    try {
      abs = resolveImagePath(relPath, 'path');
    } catch (err) {
      return errorResult(err.message);
    }

    let stat;
    try {
      stat = await fsp.stat(abs);
    } catch (err) {
      return errorResult(`Could not stat "${relPath}": ${err.message}`);
    }
    if (!stat.isFile()) {
      return errorResult(`"${relPath}" is not a file.`);
    }

    let meta;
    try {
      meta = await sharp(abs).metadata();
    } catch (err) {
      return errorResult(`sharp could not read metadata for "${relPath}": ${err.message}`);
    }

    const info = {
      path: relPath,
      width: meta.width ?? null,
      height: meta.height ?? null,
      format: meta.format ?? null,
      bytes: stat.size,
    };

    return {
      content: [
        {
          type: 'text',
          text: `${relPath}: ${info.width}x${info.height} ${info.format}, ${info.bytes} bytes`,
        },
      ],
      structuredContent: info,
    };
  },
);

// --- plate_list ---------------------------------------------------------------

const LISTABLE_EXTS = new Set(['.png', '.webp', '.jpg', '.jpeg', '.svg']);

server.registerTool(
  'plate_list',
  {
    title: 'List image plates',
    description:
      'List image files (png/webp/jpg/svg) with sizes in a public/images/ directory, non-recursive.',
    inputSchema: {
      dir: z
        .string()
        .default('public/images')
        .describe('Repo-relative directory under public/images/ to list.'),
    },
    annotations: {
      title: 'List image plates',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ dir }) => {
    let abs;
    try {
      abs = resolveImagePath(dir, 'dir');
    } catch (err) {
      return errorResult(err.message);
    }

    let entries;
    try {
      entries = await fsp.readdir(abs, { withFileTypes: true });
    } catch (err) {
      return errorResult(`Could not read directory "${dir}": ${err.message}`);
    }

    const files = [];
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!LISTABLE_EXTS.has(ext)) continue;
      const fileAbs = path.join(abs, entry.name);
      let stat;
      try {
        stat = await fsp.stat(fileAbs);
      } catch {
        continue;
      }
      files.push({
        name: entry.name,
        path: path.relative(REPO_ROOT, fileAbs),
        bytes: stat.size,
      });
    }
    files.sort((a, b) => a.name.localeCompare(b.name));

    const summary =
      files.length === 0
        ? `No image files found in ${dir}.`
        : files.map((f) => `${f.name} (${f.bytes} bytes)`).join('\n');

    return {
      content: [{ type: 'text', text: summary }],
      structuredContent: { dir, files },
    };
  },
);

// --- codex_exec ---------------------------------------------------------------

server.registerTool(
  'codex_exec',
  {
    title: 'Run Codex CLI',
    description:
      'Run `codex exec` against this repo (or a subdirectory of it) with the given prompt. ' +
      'WARNING: Codex may edit, create, or delete files in the repo while executing this ' +
      'prompt — this is not read-only. Requires the `codex` CLI to be installed and on PATH.',
    inputSchema: {
      prompt: z.string().min(1).describe('Prompt to pass to `codex exec`.'),
      cwd: z
        .string()
        .default('.')
        .describe('Repo-relative working directory to run codex from (default repo root).'),
      timeoutSec: z.number().int().positive().default(900).describe('Timeout in seconds.'),
    },
    annotations: {
      title: 'Run Codex CLI (may edit files)',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async ({ prompt, cwd, timeoutSec }) => {
    const hasCodex = await isOnPath('codex');
    if (!hasCodex) {
      return errorResult(
        'The `codex` CLI is not on PATH. Install it with `npm i -g @openai/codex`, ' +
          'then make sure it is authenticated, and try again.',
      );
    }

    const cwdAbs = path.resolve(REPO_ROOT, cwd || '.');
    if (path.relative(REPO_ROOT, cwdAbs).startsWith('..')) {
      return errorResult(`cwd "${cwd}" resolves outside the repo — refusing.`);
    }

    let result;
    try {
      result = await runCommand('codex', ['exec', '--cd', cwdAbs, prompt], {
        cwd: cwdAbs,
        timeoutMs: timeoutSec * 1000,
      });
    } catch (err) {
      return errorResult(`Failed to run codex: ${err.message}`);
    }

    const MAX = 40000;
    let combined = `--- stdout ---\n${result.stdout}\n--- stderr ---\n${result.stderr}`;
    let truncated = false;
    if (combined.length > MAX) {
      combined = combined.slice(0, MAX);
      truncated = true;
    }
    const header = `codex exec exited with code ${result.code}${result.timedOut ? ' (timed out, killed)' : ''}\n\n`;
    const text = header + combined + (truncated ? '\n\n[output truncated to 40000 chars]' : '');

    return {
      content: [{ type: 'text', text }],
      structuredContent: {
        code: result.code,
        timedOut: result.timedOut,
        truncated,
      },
    };
  },
);

/** Check whether a command name resolves on PATH. */
function isOnPath(cmd) {
  return new Promise((resolve) => {
    const finder = process.platform === 'win32' ? 'where' : 'which';
    const child = spawn(finder, [cmd], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('exit', (code) => resolve(code === 0));
  });
}

/** Run a command, capturing stdout/stderr, killing it on timeout. */
function runCommand(cmd, args, { cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, args, { cwd });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[pointcast-plates] MCP server running on stdio');
}

main().catch((err) => {
  console.error('[pointcast-plates] fatal error:', err);
  process.exit(1);
});
