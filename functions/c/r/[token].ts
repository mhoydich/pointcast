/**
 * GET/POST /c/r/<token>  The reply page: plain HTML, no JavaScript. GET renders the message and one button per chip;
 * POST (the button) applies the answer exactly as /api/communicator/reply does. noindex, no contact details.
 */
import { replyPage } from '../../_lib/communicator-page.ts';
import type { FlowEnv } from '../../_lib/communicator-flow.ts';

const handler: PagesFunction<FlowEnv> = async ({ request, env, params }) => replyPage({ request, env }, String(params.token || ''));
export const onRequestGet = handler;
export const onRequestPost = handler;
