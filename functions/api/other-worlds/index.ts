import { handleStatus } from './_handlers';
import type { OtherWorldsEnv } from './_shared';
export const onRequestGet: PagesFunction<OtherWorldsEnv> = ({request,env}) => handleStatus(request,env);
