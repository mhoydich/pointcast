import type { APIRoute } from 'astro';
import { reviewsBySlug } from '../../data/reviews';
import {
  ART_CREDIT,
  CHANGE_SCHEDULE,
  DESK_DATE,
  FEEDERS,
  NECTAR,
  NO_COMMISSION,
  PICKS,
  PLANTS,
  RUBRIC,
  SOURCES,
  UNVERIFIED,
} from '../../lib/hummingbird-feeders.mjs';

const base = reviewsBySlug.get('hummingbird-feeders')!;

const review = {
  schema: 'pointcast.review/v1',
  ...base,
  url: 'https://pointcast.xyz/reviews/hummingbird-feeders',
  method: `desk review, checked ${DESK_DATE}: maker pages and retailer listings for all nine feeders. Hands-on tester reports exist for two of the nine (Bob Vila's six-week yard test of the HummZinger HighView and the Perky-Pet 217) plus Bird Watching HQ on the 16-oz sibling of the First Nature 3055; Birds & Blooms supplies style-level guidance. PointCast has not used these feeders. The ranking comes from published specs and the cited testers, scored on the rubric below.`,
  handsOnTesterCoverage: {
    feeders: ['hummzinger-highview', 'perky-pet-217'],
    tester: 'Bob Vila (six-week yard test)',
    siblingOnly: { feeder: 'first-nature-3055', tester: 'Bird Watching HQ', note: 'years of use reported for the 16-oz model, not the 32-oz 3055' },
    makerAndRetailerOnly: ['more-birds-big-gulp', 'more-birds-diamond', 'perky-pet-209b', 'more-birds-3-in-1', 'best-1-32oz', 'aspects-jewel-box'],
  },
  handsOn: false,
  rating: {
    value: null,
    reason: 'Desk review. No star rating, because no feeder was handled. Each feeder carries a rubric score out of 10 instead.',
  },
  rubric: RUBRIC.map((c) => ({ key: c.key, label: c.label, weight: c.weight, why: c.why, rules: c.scale.map((s) => s.rule), note: c.note })),
  scoreFormula: 'total = 0.4 * cleaning + 0.2 * defenses + 0.2 * durability + 0.1 * capacity + 0.1 * price, rounded to one decimal; ties break on cleaning, then on price.',
  feeders: FEEDERS.map((f) => ({
    rank: f.rank,
    id: f.id,
    model: f.model,
    maker: f.maker,
    style: f.style,
    capacityOz: f.capacityOz,
    ports: f.ports,
    material: f.material,
    cleaning: f.cleaningText,
    beeAndAnt: f.defensesText,
    price: { text: f.priceText, lowUsd: f.priceLow, highUsd: f.priceHigh, verified: f.priceVerified, checked: DESK_DATE },
    complaints: f.complaints,
    inputs: { cleaning: f.cleaning, ant: f.ant, bee: f.bee, durabilityAdjustments: f.durability },
    scores: f.scores,
    total: f.total,
    makerPage: f.makerPage,
    sourceIds: f.sourceIds,
  })),
  picks: PICKS,
  care: {
    nectar: NECTAR,
    changeSchedule: CHANGE_SCHEDULE,
    changeImmediatelyIf: ['cloudy', 'mold', 'insects in the reservoir', 'a sick bird has visited'],
    cleaning: 'Wash the feeder at every nectar change (Audubon feeding FAQ: emptied and cleaned on the change schedule). Hot tap water with hydrogen peroxide or a weak vinegar solution; no dish soap, which can leave a harmful residue. Take it apart and brush every nectar surface. More Birds maker pages: no dishwasher, vinegar-water soak. Widely repeated Cornell guidance (not opened at source) also allows a 1:9 bleach soak; if used, rinse thoroughly with clean water and air-dry before refilling.',
    antsAndBees: 'Ant moat above the feeder. All-red feeder with narrow ports or bee guards; skip yellow decor; wipe drips, since spilled nectar defeats any guard (Audubon).',
    windows: '3-or-30 rule (Yakima Valley Audubon): closer than 3 feet or farther than 30 feet from glass.',
    placement: 'Plastic reservoirs in shade (Birds & Blooms). Heavy glass on a sturdy hook (Bob Vila found a 40-oz More Birds Garnet needed its strongest hook).',
  },
  local: {
    area: 'El Segundo and the South Bay, coastal Los Angeles County',
    yearRound: ["Anna's Hummingbird (Calypte anna)", "Allen's Hummingbird, resident subspecies Selasphorus sasin sedentarius"],
    springMigrants: ['Rufous Hummingbird', "migratory Allen's Hummingbird"],
    allensGrowth: 'Clark 2017 (The Condor), from eBird: mainland range about 70 km² in 1970 to about 13,000 km² by 2016; on more than 20% of Southern California checklists; an estimated 46,000–350,000 birds.',
    winter: "Keep feeders up. Anna's are resident from Baja California to southern coastal British Columbia and common at feeders in winter (Project FeederWatch). A feeder can stay up year-round where hummingbirds remain, and leaving it up does not keep migrants from heading south (Audubon feeding FAQ).",
    annasAbundance: "Abundant year-round in Los Angeles County, especially the coastal lowlands, foothills and urban areas; the male is the only North American hummingbird with a red crown (Palos Verdes–South Bay Sierra Club).",
    nativePlants: PLANTS,
    plantFinder: 'https://calscape.org/support-wildlife/',
  },
  sources: SOURCES,
  notVerified: UNVERIFIED,
  affiliateLinks: 'none',
  linkPolicy: `Maker pages only, labeled "maker page". Retailer listings are cited as sources, not as buy links. ${NO_COMMISSION}`,
  artCredit: ART_CREDIT,
  images: {
    hero: 'https://pointcast.xyz/images/hummingbird-feeders/hero.jpg',
    heroWebp: 'https://pointcast.xyz/images/hummingbird-feeders/hero.webp',
    feederTypes: 'https://pointcast.xyz/images/hummingbird-feeders/feeder-types.jpg',
    feederTypesWebp: 'https://pointcast.xyz/images/hummingbird-feeders/feeder-types.webp',
  },
  links: {
    reviewsDesk: 'https://pointcast.xyz/reviews',
    careGuide: 'https://pointcast.xyz/reviews/hummingbird-feeders#care',
    pointcastBlock: 'https://pointcast.xyz/b/0629',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(review, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
