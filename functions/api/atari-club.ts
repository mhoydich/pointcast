import { handleClubGet, handleClubPost, type ClubEnv } from './atari-club/_store.ts';
export const onRequestGet: PagesFunction<ClubEnv> = ({ request, env }) => handleClubGet(request, env);
export const onRequestPost: PagesFunction<ClubEnv> = ({ request, env }) => handleClubPost(request, env);
