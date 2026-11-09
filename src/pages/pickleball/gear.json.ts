import { GEAR_META, GEAR_URL, PEOPLE, publicPerson } from '../../lib/player-gear';

const body = {
  ...GEAR_META,
  url: GEAR_URL,
  how: {
    paddle: 'Each paddle item carries paddleId; read https://pointcast.xyz/paddles/{paddleId}.json for its specs, dates and approvals.',
    csv: `${GEAR_URL}.csv`,
    pros: 'https://pointcast.xyz/pickleball/pros/{slug}',
    basis: 'brand = the brand or a press release says so; news = a dated article says so; self-declared = the player said so themselves.',
  },
  people: PEOPLE.map(publicPerson),
};

export const GET = () => new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
