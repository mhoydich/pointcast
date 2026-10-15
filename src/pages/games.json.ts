import type { APIRoute } from 'astro';
import { GAME_LIBRARY, gameLanding, gameDownload, gameDownloadType } from '../lib/game-library';
export const GET: APIRoute = () => new Response(JSON.stringify({version:'1.0.0',title:'PointCast Games',url:'https://pointcast.xyz/games/',count:GAME_LIBRARY.length,games:GAME_LIBRARY.map(game=>({...game,landing:gameLanding(game),download:{url:gameDownload(game),type:gameDownloadType(game),note:game.download.note}}))},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300'}});
