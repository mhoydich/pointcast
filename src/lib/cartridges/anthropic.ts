/**
 * Anthropic cartridge — first cartridge type for v0.41.
 *
 * Streamed POST to https://api.anthropic.com/v1/messages with the
 * user's API key. Supports text.complete (single-shot summarize-style
 * affordances) and text.chat (multi-turn). Vision input wired but
 * unused until the manifest emitter sends image attachments.
 *
 * The cartridge runs entirely client-side. The user's API key is
 * fetched from sparrow:cartridges:keys:<id> via
 * sparrow-cartridges.fetchKey(), used for one request, and dropped.
 *
 * Why no SDK: the Anthropic API is a single POST; an SDK would add
 * 50KB of wrapper for two function calls. This module does the same
 * with `fetch` + a streaming SSE parser.
 *
 * See docs/plans/2026-04-29-sparrow-cartridge-front-door.md §VIII.
 */

import type { Cartridge, CartridgeCapability } from '../sparrow-cartridges';
import { fetchKey, makeCartridge } from '../sparrow-cartridges';

// ─── Public surface ─────────────────────────────────────────────────

/**
 * Reasonable defaults for a brand-new Anthropic cartridge. Users can
 * tweak the model via /sparrow/cartridges; everything else stays
 * provider-canonical.
 */
export function defaultAnthropicCartridge(opts?: {
  id?: string;
  label?: string;
  model?: string;
}): Cartridge {
  return makeCartridge({
    id: opts?.id ?? 'claude-personal',
    provider: 'anthropic',
    model: opts?.model ?? 'claude-sonnet-4-5-20251020',
    label: opts?.label ?? 'Claude · personal',
    capabilities: [
      'text.complete',
      'text.chat',
      'text.tool_use',
      'image.understand',
    ] as CartridgeCapability[],
    auth: {
      method: 'api_key',
      header: 'x-api-key',
      endpoint: 'https://api.anthropic.com/v1/messages',
    },
    color: 'oklch(74% 0.16 72)', // ember
    glyph: '✦',
    limits: {
      context_tokens: 200000,
      rate_per_min: 50,
      cost_estimate_per_1k_input: 0.003,
      cost_estimate_per_1k_output: 0.015,
    },
  });
}

// ─── Streamed completion ─────────────────────────────────────────────

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicStreamChunk {
  /** Cumulative text so far. */
  text: string;
  /** Just the latest delta (one or more tokens). */
  delta: string;
  /** True when the stream finishes cleanly. */
  done: boolean;
  /** Error message when the stream fails. */
  error?: string;
  /** Stop reason once `done: true`. */
  stop_reason?: string;
  /** Final usage when reported by the API. */
  usage?: { input_tokens: number; output_tokens: number };
}

export interface AnthropicCompleteOptions {
  cartridge: Cartridge;
  /** System prompt — short, single string. */
  system?: string;
  /** Conversation messages (must end with role:user). */
  messages: AnthropicMessage[];
  /** Token cap. Defaults to 1024. */
  max_tokens?: number;
  /** Optional model override (otherwise uses cartridge.model). */
  model?: string;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Callback per stream chunk. */
  onChunk?: (chunk: AnthropicStreamChunk) => void;
}

/**
 * Run a streamed completion against the cartridge's Anthropic API.
 * Resolves with the final chunk (text + usage). Throws on transport
 * errors; surfaces API errors via the chunk.error field so the UI
 * can render them as artifacts of `kind: "error"`.
 */
export async function complete(opts: AnthropicCompleteOptions): Promise<AnthropicStreamChunk> {
  const { cartridge, signal, onChunk } = opts;

  if (cartridge.provider !== 'anthropic') {
    throw new Error(`anthropic.complete called with non-anthropic cartridge (${cartridge.provider})`);
  }

  const apiKey = await fetchKey(cartridge.id);
  if (!apiKey) throw new Error('cartridge key missing or could not be decrypted');

  const body = JSON.stringify({
    model: opts.model ?? cartridge.model,
    max_tokens: opts.max_tokens ?? 1024,
    stream: true,
    system: opts.system,
    messages: opts.messages,
  });

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
    [cartridge.auth.header || 'x-api-key']: cartridge.auth.header_prefix
      ? `${cartridge.auth.header_prefix}${apiKey}`
      : apiKey,
  };

  let response: Response;
  try {
    response = await fetch(cartridge.auth.endpoint, {
      method: 'POST',
      headers,
      body,
      signal,
    });
  } catch (err) {
    const final: AnthropicStreamChunk = {
      text: '',
      delta: '',
      done: true,
      error: err instanceof Error ? err.message : String(err),
    };
    onChunk?.(final);
    return final;
  }

  if (!response.ok || !response.body) {
    let detail = '';
    try { detail = await response.text(); } catch { /* empty */ }
    const final: AnthropicStreamChunk = {
      text: '',
      delta: '',
      done: true,
      error: `HTTP ${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ''}`,
    };
    onChunk?.(final);
    return final;
  }

  return await consumeStream(response.body, onChunk);
}

// ─── SSE stream consumer ─────────────────────────────────────────────

/**
 * Consume Anthropic's `event-stream` response, accumulating delta
 * tokens and surfacing chunks via the optional callback. Returns the
 * final chunk when the stream ends.
 *
 * Anthropic's SSE protocol uses these event types:
 *   message_start, content_block_start, content_block_delta,
 *   content_block_stop, message_delta, message_stop, ping, error.
 *
 * Only content_block_delta carries new text in current API versions.
 * We tolerate unknown event types by ignoring them.
 */
async function consumeStream(
  body: ReadableStream<Uint8Array>,
  onChunk?: (chunk: AnthropicStreamChunk) => void,
): Promise<AnthropicStreamChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  let stopReason: string | undefined;
  let usage: AnthropicStreamChunk['usage'] | undefined;
  let lastError: string | undefined;

  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      break;
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    // SSE events are separated by blank lines (\n\n).
    let sep = buffer.indexOf('\n\n');
    while (sep !== -1) {
      const event = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLines = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim());
      for (const data of dataLines) {
        if (!data) continue;
        try {
          const obj = JSON.parse(data) as {
            type?: string;
            delta?: { type?: string; text?: string; stop_reason?: string };
            usage?: { input_tokens?: number; output_tokens?: number };
            error?: { message?: string };
          };
          if (obj.type === 'content_block_delta' && obj.delta?.type === 'text_delta' && obj.delta.text) {
            text += obj.delta.text;
            onChunk?.({ text, delta: obj.delta.text, done: false });
          } else if (obj.type === 'message_delta') {
            if (obj.delta?.stop_reason) stopReason = obj.delta.stop_reason;
            if (obj.usage) {
              usage = {
                input_tokens: obj.usage.input_tokens ?? 0,
                output_tokens: obj.usage.output_tokens ?? 0,
              };
            }
          } else if (obj.type === 'error') {
            lastError = obj.error?.message ?? 'stream error';
          }
        } catch {
          /* malformed event — skip */
        }
      }
      sep = buffer.indexOf('\n\n');
    }
  }

  const final: AnthropicStreamChunk = {
    text,
    delta: '',
    done: true,
    error: lastError,
    stop_reason: stopReason,
    usage,
  };
  onChunk?.(final);
  return final;
}

// ─── Convenience: single-shot summarize ──────────────────────────────

/**
 * Run a one-shot completion with a system prompt + a single user
 * message. Useful for "Summarize this block" affordances where there's
 * no prior context to maintain.
 */
export async function summarize(
  cartridge: Cartridge,
  systemPrompt: string,
  userPrompt: string,
  opts?: { onChunk?: (c: AnthropicStreamChunk) => void; signal?: AbortSignal; max_tokens?: number },
): Promise<AnthropicStreamChunk> {
  return complete({
    cartridge,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: opts?.max_tokens ?? 1024,
    onChunk: opts?.onChunk,
    signal: opts?.signal,
  });
}
