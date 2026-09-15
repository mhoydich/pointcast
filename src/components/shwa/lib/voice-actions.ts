import { z } from 'zod';
import { safeSource, type CanvasItem, type ResearchResult } from './canvas';

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
export type VoiceAction = { callId: string; name: 'search_web' | 'generate_image'; prompt: string; card: CanvasItem };
const researchSchema = z.object({
  parts: z.array(z.object({ text: z.string().max(18000), citations: z.array(z.object({
    start: z.number().int().nonnegative(), end: z.number().int().positive(),
    url: z.string().refine(value => !!safeSource(value)), title: z.string().max(300),
  })).max(100) })).max(20), estimatedCost: z.number().finite().nonnegative(),
}).refine(result => result.parts.some(part => part.citations.length) && result.parts.every(part => part.citations.every(c => c.start < c.end && c.end <= part.text.length)));
const imageSchema = z.object({ image: z.string().max(14000000).regex(/^[A-Za-z0-9+/=]+$/), mimeType: z.literal('image/webp'), estimatedCost: z.number().finite().nonnegative() });
export type VoiceActionResult = ({ research: ResearchResult } | { imageUrl: string; estimatedCost: number }) & { voiceDelivery: 'queued' | 'unavailable' };

/** A per-call dispatcher. Only provider-issued completed function items can request work. */
export function createVoiceActions(options: {
  canStart: () => boolean; isCurrent: () => boolean;
  execute: (callId: string) => Promise<unknown>;
  onStart: (action: VoiceAction) => void;
  onResult: (action: VoiceAction, result: VoiceActionResult) => void;
  onError: (action: VoiceAction, message: string) => void;
  onCost: (kind: 'reasoning' | 'research' | 'images', amount: number) => void;
  onReasoning: (state: 'working' | 'complete' | 'error') => void;
}) {
  const calls = new Set<string>(), billed = new Set<string>();
  let pending = 0;
  async function run(action: VoiceAction) {
    pending++;
    options.onStart(action);
    try {
      const receipt = await options.execute(action.callId);
      if (!object(receipt) || receipt.callId !== action.callId || receipt.name !== action.name) throw Error('The result could not be matched to this request. No automatic retry.');
      if (receipt.status !== 'completed') throw Error(typeof receipt.message === 'string' ? receipt.message.slice(0,600) : 'This request did not finish. Ask Shwa again if you want to retry.');
      const result = action.name === 'search_web' ? researchSchema.parse(receipt.result) : imageSchema.parse(receipt.result);
      options.onCost(action.name === 'search_web' ? 'research' : 'images', result.estimatedCost);
      if (!options.isCurrent()) return;
      const voiceDelivery = receipt.voiceDelivery === 'queued' ? 'queued' : 'unavailable';
      if ('parts' in result) options.onResult(action, { research: result, voiceDelivery });
      else options.onResult(action, { imageUrl: `data:image/webp;base64,${result.image}`, estimatedCost: result.estimatedCost, voiceDelivery });
    } catch (error) {
      if (!options.isCurrent()) return;
      options.onError(action, error instanceof Error && error.name !== 'ZodError' ? error.message : 'The tool result was not usable. It may have been charged; no automatic retry.');
    } finally { pending--; }
  }
  return {
    handle(value: unknown) {
      if (!options.canStart() || !object(value)) return;
      if (value.type === 'session.delegation.created') { options.onReasoning('working'); return; }
      if (value.type !== 'response.event' || !object(value.event)) return;
      const event = value.event;
      if (event.type === 'response.created') options.onReasoning('working');
      if (['response.completed','response.failed','response.incomplete'].includes(String(event.type)) && object(event.response)) {
        const response = event.response;
        if (!pending || event.type !== 'response.completed') options.onReasoning(event.type === 'response.completed' ? 'complete' : 'error');
        if (typeof response.id === 'string' && !billed.has(response.id) && object(response.usage)) {
          billed.add(response.id);
          const usage = response.usage, input = number(usage.input_tokens), output = number(usage.output_tokens);
          const cached = object(usage.input_tokens_details) ? Math.min(input, number(usage.input_tokens_details.cached_tokens)) : 0;
          // Astra standard short-context pricing. All output tokens include reasoning.
          options.onCost('reasoning', ((input - cached) * 10 + cached + output * 50) / 1e6);
        }
      }
      if (event.type !== 'response.output_item.done' || !object(event.item)) return;
      const item = event.item;
      if (item.type !== 'function_call' || !['search_web','generate_image'].includes(String(item.name)) || typeof item.call_id !== 'string' || !/^[\w-]{1,200}$/.test(item.call_id) || calls.has(item.call_id) || calls.size >= 12 || typeof item.arguments !== 'string' || item.arguments.length > 4096) return;
      let args: unknown; try { args = JSON.parse(item.arguments); } catch { return; }
      if (!object(args)) return;
      const name = item.name as VoiceAction['name'], raw = name === 'search_web' ? args.question : args.prompt;
      if (typeof raw !== 'string' || !raw.trim() || raw.length > 1600) return;
      calls.add(item.call_id);
      const card: CanvasItem = { id: `voice-${item.call_id}`, createdAt: Date.now(), kind: name === 'search_web' ? 'research' : 'image',
        title: name === 'search_web' ? 'Looking into it' : 'Making your idea', text: 'From your spoken request.', prompt: raw.trim(),
        options: [], questions: [], points: [], unit: '', min: 0, max: 0, step: 0, value: 0, lowLabel: '', highLabel: '', basis: 'conversation',
        workState: 'pending', workMessage: name === 'search_web' ? 'Checking your request and searching the web…' : 'Checking your request and generating the image…',
      };
      void run({ callId: item.call_id, name, prompt: raw.trim(), card });
    },
  };
}
