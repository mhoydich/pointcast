/** /og/collect/today.png — the collecting desk's stable unfurl URL. */
import { renderKennelTodayOg } from '../kennel-club/today.png';

export const onRequestGet: PagesFunction = ({ request }) => renderKennelTodayOg(
  request,
  '/images/og-collect.png',
);
