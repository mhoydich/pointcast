import { handleReceipt } from './_handlers';
import type { OtherWorldsEnv } from './_shared';
export const onRequestGet: PagesFunction<OtherWorldsEnv> = ({request,env}) => handleReceipt(request,env);
