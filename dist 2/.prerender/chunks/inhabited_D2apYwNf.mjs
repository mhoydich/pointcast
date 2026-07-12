import { b as booth } from './spotify-booth_DhKiU-de.mjs';
import { c as cb } from './cb-traffic_Btycl4gm.mjs';
import { l as lobby } from './lobby_DCpAfVBp.mjs';

const GET = () => {
  const body = {
    surface: "inhabited",
    description: "index of the three rooms with named occupants — booth (music), cb (talk), lobby (visitors).",
    url: "https://pointcast.xyz/inhabited",
    rooms: {
      booth: {
        url: "https://pointcast.xyz/booth",
        json: "https://pointcast.xyz/booth.json",
        residents: booth.residents.length,
        spinning: booth.residents.filter((r) => r.track.spotifyId).length,
        todays_mix_set: booth.todaysMix.spotifyId.length > 0
      },
      cb: {
        url: "https://pointcast.xyz/cb",
        json: "https://pointcast.xyz/cb.json",
        channel: cb.channel,
        operators: cb.operators.length,
        chatter: cb.operators.filter((o) => o.phase === "commentary").length,
        clear: cb.operators.filter((o) => o.phase === "final").length
      },
      lobby: {
        url: "https://pointcast.xyz/lobby",
        json: "https://pointcast.xyz/lobby.json",
        seats_filled: lobby.currentlyHere.length,
        seats_total: lobby.house.seatsTotal,
        guestbook_entries: lobby.guestbook.length,
        visitor_count: lobby.visitorCount
      }
    }
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
