import { handleClaim } from './_handlers';
import type { OtherWorldsEnv } from './_shared';
export const onRequestPost: PagesFunction<OtherWorldsEnv> = ({request,env}) => handleClaim(request,env);
