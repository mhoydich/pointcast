import type { APIRoute } from 'astro';
import { BEACH_COMMONS_V18, GOVERNING_RULES, RADIUS_DOORS, RADIUS_GOALS, RADIUS_SOURCES, RADIUS_STRENGTHS, ROADMAP_OPTIONS, ROADMAP_PHASES, STRENGTH_SCORE, VISUAL_PLATES, WORKING_PAIRS } from '../../lib/beach-commons-v18';
export const GET: APIRoute = () => new Response(JSON.stringify({
  ...BEACH_COMMONS_V18,
  premise:'The regional advantage is not a list of nearby assets. Proximity becomes strength when two existing capabilities finish something useful together, publish the proof, and make repetition easier.',
  framework:{strengths:RADIUS_STRENGTHS,geographicDoors:RADIUS_DOORS,workingPairs:WORKING_PAIRS,goals:RADIUS_GOALS},
  combinationBuilder:{availability:'human HTML edition only',startingStrengths:8,goals:5,combinations:40,routes:ROADMAP_OPTIONS,storage:false,analytics:false,geolocation:false,registration:false,networkWrites:false,identity:false},
  roadmap:ROADMAP_PHASES,
  strengthScore:{criteria:STRENGTH_SCORE,totalPoints:100,distinction:'Evidence score remains separate from recognition, applause, popularity, or aesthetic preference.'},
  governingRules:GOVERNING_RULES,
  visuals:VISUAL_PLATES.map(p=>({...p,src:new URL(p.src,BEACH_COMMONS_V18.url).href})),currentSources:RADIUS_SOURCES,
  methodology:{researchCheckedAt:'2026-07-31T22:30:00-07:00',radiusBoundary:BEACH_COMMONS_V18.radiusDefinition,geographicBoundary:'Named districts and institutions are evidence of capability and geographic orientation. They are not proposed members, partners, hosts, funders, sites, or endorsers. Edge locations are approximate.',activityBoundary:'No coalition, event, procurement, pilot, construction, environmental activity, data collection, registration, public program, payment, physical setup, or partnership is announced.',interactionBoundary:'The HTML builder performs local in-page selection only. It does not store, transmit, identify, register, geolocate, or write to a network.',visuals:'Eight original speculative editorial images generated for PointCast with OpenAI image generation. They are not documentary photographs, maps, approved plans, operational diagrams, proposed sites, or evidence of participation.'}
},null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600','Access-Control-Allow-Origin':'*',Link:'<https://pointcast.xyz/beach-commons/v18>; rel="alternate"; type="text/html"'}});
