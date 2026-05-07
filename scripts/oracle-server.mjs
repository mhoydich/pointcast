#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { answerQuestion, computeAtlas, localCommandExists, readAtlas, reindex } from './lib/oracle-rag.mjs';
import { REPO_ROOT } from './lib/oracle-blocks.mjs';

const PORT = Number(process.env.POINTCAST_ORACLE_PORT || 8789);
const TMP_DIR = join(REPO_ROOT, '.pointcast/tmp');
const RESIDENT_STATUS = join(REPO_ROOT, '.pointcast/resident/status.json');

function send(res, status, data, headers = {}) {
  const body = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': typeof data === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
  res.end(body);
}

async function readBody(req, maxBytes = 30_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('request-too-large');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonRequest(req) {
  const body = await readBody(req);
  if (!body.length) return {};
  return JSON.parse(body.toString('utf8'));
}

async function readJsonFile(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: options.encoding || 'utf8',
    timeout: options.timeout || 20_000,
    maxBuffer: options.maxBuffer || 10 * 1024 * 1024,
    stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
  });
}

async function transcribeAudio({ audioBase64, mime, text }) {
  if (text && text.trim()) return { text: text.trim(), engine: 'typed' };
  if (!audioBase64) return { text: '', engine: 'none', warning: 'missing audio payload' };

  await mkdir(TMP_DIR, { recursive: true });
  const id = randomUUID();
  const ext = mime?.includes('wav') ? 'wav' : mime?.includes('mp4') ? 'm4a' : 'webm';
  const audioPath = join(TMP_DIR, `${id}.${ext}`);
  const outBase = join(TMP_DIR, `${id}-whisper`);
  await writeFile(audioPath, Buffer.from(audioBase64, 'base64'));

  try {
    const bin = process.env.WHISPER_CPP_BIN || localCommandExists('whisper-cli') || localCommandExists('main');
    const model = process.env.WHISPER_MODEL || join(REPO_ROOT, 'models/ggml-small.en.bin');
    if (!bin || !existsSync(model)) {
      return { text: '', engine: 'missing-whisper', warning: 'Set WHISPER_CPP_BIN and WHISPER_MODEL for local STT.' };
    }
    const result = run(bin, ['-m', model, '-f', audioPath, '-otxt', '-of', outBase, '-np'], { timeout: 25_000 });
    if (result.status !== 0) {
      return { text: '', engine: 'whisper.cpp', warning: result.stderr?.slice(0, 300) || 'whisper failed' };
    }
    const transcript = (await readFile(`${outBase}.txt`, 'utf8')).trim();
    return { text: transcript, engine: 'whisper.cpp' };
  } finally {
    await rm(audioPath, { force: true });
    await rm(`${outBase}.txt`, { force: true });
  }
}

async function synthesizeSpeech(text) {
  await mkdir(TMP_DIR, { recursive: true });
  const id = randomUUID();
  const out = join(TMP_DIR, `${id}.wav`);
  const cmd = process.env.KOKORO_TTS_CMD;
  const bin = process.env.KOKORO_BIN || localCommandExists('kokoro-tts');

  try {
    if (cmd) {
      const shell = cmd
        .replaceAll('{text}', JSON.stringify(text))
        .replaceAll('{out}', JSON.stringify(out));
      const result = run('sh', ['-lc', shell], { timeout: 25_000 });
      if (result.status !== 0 || !existsSync(out)) return { audioBase64: null, mime: null, engine: 'kokoro-missing', warning: result.stderr?.slice(0, 260) };
    } else if (bin) {
      const result = run(bin, ['--text', text, '--output', out], { timeout: 25_000 });
      if (result.status !== 0 || !existsSync(out)) return { audioBase64: null, mime: null, engine: 'kokoro-missing', warning: result.stderr?.slice(0, 260) };
    } else {
      return { audioBase64: null, mime: null, engine: 'browser-fallback', warning: 'Set KOKORO_TTS_CMD or KOKORO_BIN for local TTS audio.' };
    }
    const wav = await readFile(out);
    return { audioBase64: wav.toString('base64'), mime: 'audio/wav', engine: 'kokoro' };
  } finally {
    await rm(out, { force: true });
  }
}

async function localVoiceReply(transcript, tone) {
  const toneLines = {
    saint: 'saint tone: warm, brass, tender, patron Noun energy, spare blessing.',
    koan: 'koan tone: short paradox, no explanation unless needed.',
    mantra: 'mantra tone: rhythmic, repeatable, calm.',
    weather: 'weather tone: concrete, sensory, immediate, like a forecast for the room.',
  };
  const { answer } = await answerQuestion(`${tone || 'saint'} tone answer this visit-channel utterance: ${transcript}`);
  const cleaned = answer
    .replace(/\nReceipts:[\s\S]*$/m, '')
    .replace(/\[[^\]]+\]\(\/b\/\d{4}\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const prefix = toneLines[tone] || toneLines.saint;
  return cleaned ? cleaned.slice(0, 700) : `${prefix} The bell heard you. Sit with the sound for one breath.`;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
    if (req.method === 'OPTIONS') return send(res, 204, { ok: true });

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return send(res, 200, { ok: true, service: 'pointcast-oracle', port: PORT });
    }

    if (req.method === 'POST' && url.pathname === '/api/ask') {
      const body = await readJsonRequest(req);
      if (!body.question) return send(res, 400, { ok: false, error: 'missing question' });
      return send(res, 200, await answerQuestion(String(body.question)));
    }

    if (req.method === 'POST' && url.pathname === '/api/reindex') {
      const body = await readJsonRequest(req);
      return send(res, 200, await reindex({ force: Boolean(body.force), recomputeAtlas: true }));
    }

    if (req.method === 'GET' && url.pathname === '/api/atlas') {
      const atlas = await readAtlas();
      return send(res, atlas ? 200 : 404, atlas || { ok: false, error: 'atlas-not-built', command: 'npm run reindex' });
    }

    if (req.method === 'POST' && url.pathname === '/api/atlas/recompute') {
      return send(res, 200, await computeAtlas());
    }

    if (req.method === 'GET' && url.pathname === '/api/resident/status') {
      return send(res, 200, await readJsonFile(RESIDENT_STATUS, {
        ok: true,
        running: false,
        currentTask: null,
        runs: [],
        successCount: 0,
        failCount: 0,
        computeHours: 0,
        note: 'Resident loop has not written status yet. Run npm run resident.',
      }));
    }

    if (req.method === 'POST' && url.pathname === '/api/visit-channel') {
      const started = Date.now();
      const body = await readJsonRequest(req);
      const stt = await transcribeAudio(body);
      const transcript = stt.text || body.text || '';
      const reply = await localVoiceReply(transcript || 'say one short bell blessing', body.tone || 'saint');
      const tts = await synthesizeSpeech(reply);
      return send(res, 200, {
        ok: true,
        transcript,
        reply,
        tone: body.tone || 'saint',
        stt,
        tts,
        elapsedMs: Date.now() - started,
        privacy: 'no persistent transcript or audio log written by the server',
      });
    }

    return send(res, 404, { ok: false, error: 'not-found' });
  } catch (error) {
    return send(res, 500, { ok: false, error: error.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[pointcast-oracle] http://127.0.0.1:${PORT}`);
});
