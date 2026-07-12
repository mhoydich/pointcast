import { p as pickCardOfTheDay } from './card-of-the-day_bp_L5sch.mjs';

function mix(seed, salt) {
  let h = (seed ^ salt) >>> 0;
  h = Math.imul(h ^ h >>> 16, 2246822507) >>> 0;
  h = Math.imul(h ^ h >>> 13, 3266489909) >>> 0;
  return (h ^ h >>> 16) >>> 0;
}
function fakeSeedTraits(id) {
  return {
    bg: mix(id, 1) % 2,
    body: mix(id, 2) % 30,
    accessory: mix(id, 3) % 140,
    head: mix(id, 4) % 240,
    glasses: mix(id, 5) % 21
  };
}
const BATTLER_TYPES = ["WATER", "BEAM", "ARMOR", "WILD", "FEAST"];
function headToType(head) {
  return BATTLER_TYPES[mix(head, 170) % BATTLER_TYPES.length];
}
function glassesToType(glasses) {
  return BATTLER_TYPES[mix(glasses, 187) % BATTLER_TYPES.length];
}
function contrib(idx, salt) {
  return mix(idx, salt) % 25 - 12;
}
function seedToStats(id) {
  const t = fakeSeedTraits(id);
  const headType = headToType(t.head);
  const glassesType = glassesToType(t.glasses);
  const ATKraw = 50 + contrib(t.head, 16) + contrib(t.accessory, 17) + (t.body % 2 ? 2 : -2);
  const DEFraw = 50 + contrib(t.body, 18) + contrib(t.bg, 19);
  const SPDraw = 50 + contrib(t.glasses, 20) - Math.round(contrib(t.body, 18) * 0.5);
  const FOCraw = 50 + contrib(t.accessory, 21) + (t.glasses % 7 === 0 ? 8 : 0);
  const clamp = (v) => Math.max(1, Math.min(99, Math.round(v)));
  const ATK = clamp(ATKraw);
  const DEF = clamp(DEFraw);
  const SPD = clamp(SPDraw);
  const FOC = clamp(FOCraw);
  const HP = Math.round(70 + DEF * 0.6);
  return { id, traits: t, types: [headType, glassesType], ATK, DEF, SPD, FOC, HP };
}

const GET = async () => {
  const today = pickCardOfTheDay();
  const cardOfTheDay = seedToStats(today.id);
  const payload = {
    cardOfTheDay: {
      id: cardOfTheDay.id,
      seedTraits: cardOfTheDay.traits,
      date: today.date,
      dateLabel: today.dateLabel,
      note: today.note,
      rosterIndex: today.rosterIndex
    },
    phase: 2,
    stanceRules: {
      format: "best-of-3",
      stances: ["STRIKE", "GUARD", "FOCUS"],
      beats: {
        STRIKE: "FOCUS",
        GUARD: "STRIKE",
        FOCUS: "GUARD"
      }
    },
    typeMatchups: {
      WATER: "BEAM",
      BEAM: "ARMOR",
      ARMOR: "WILD",
      WILD: "WATER",
      FEAST: null
    },
    entrypoints: ["/battle", "/c/battler", "/c/battler.json"]
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
