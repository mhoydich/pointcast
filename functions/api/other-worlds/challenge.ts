import { handleChallenge } from './_handlers';
import type { OtherWorldsEnv } from './_shared';
export const onRequestPost: PagesFunction<OtherWorldsEnv> = ({request,env}) => handleChallenge(request,env);
