import { realEstateRequest } from '../../_lib/real-estate-api.mjs';
export const onRequest: PagesFunction = ({request}) => realEstateRequest(request);
