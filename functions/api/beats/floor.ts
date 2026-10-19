/**
 * /api/beats/floor — how many humans are in each of the Floor's always-on rooms (bc-nbpub-<slug>).
 * GET → { rooms: { basement: 2, roof: 0, … }, at, maxAge }   (edge-cached ~8 s; `null` = unknown)
 * Reads each DrumRoomV2's `?stats=1` (the same `connected` its welcome frame carries); opens no sockets.
 */
import { floorStats, options, type BeatsEnv } from '../../_lib/beats-wall';

export const onRequestOptions: PagesFunction<BeatsEnv> = options;
export const onRequestGet: PagesFunction<BeatsEnv> = ({ request, env }) => floorStats(request, env);
