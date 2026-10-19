import { handleInternshipDesk, type InternshipDeskEnv } from '../_lib/internship-desk.ts';

export const onRequest: PagesFunction<InternshipDeskEnv> = ({ request, env }) => handleInternshipDesk(request, env);
