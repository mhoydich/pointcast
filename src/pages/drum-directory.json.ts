import type { APIRoute } from "astro";
import {
  DRUM_DIRECTORY_CHAPTERS,
  DRUM_DIRECTORY_COUNTS,
  DRUM_DIRECTORY_ENTRIES,
  DRUM_DIRECTORY_META,
  DRUM_RUNNER_EDITIONS,
} from "../lib/drum-directory";

export const GET: APIRoute = async () => {
  const payload = {
    schema: "https://pointcast.xyz/schemas/editorial-directory/v1",
    id: DRUM_DIRECTORY_META.id,
    title: DRUM_DIRECTORY_META.title,
    issue: DRUM_DIRECTORY_META.issue,
    description: DRUM_DIRECTORY_META.description,
    canonical: DRUM_DIRECTORY_META.canonical,
    publishedAt: DRUM_DIRECTORY_META.publishedAt,
    counts: DRUM_DIRECTORY_COUNTS,
    art: {
      type: "original generator-made editorial plates",
      plates: DRUM_DIRECTORY_META.generatedPlates.map((plate) => ({
        name: plate.name,
        url: `https://pointcast.xyz${plate.path}`,
        alt: plate.alt,
      })),
    },
    chapters: DRUM_DIRECTORY_CHAPTERS.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      kicker: chapter.kicker,
      title: chapter.title,
      description: chapter.description,
      games: DRUM_DIRECTORY_ENTRIES.filter((entry) => entry.chapter === chapter.id).map((entry) => ({
        slug: entry.slug,
        name: entry.name,
        url: `https://pointcast.xyz${entry.path}`,
        path: entry.path,
        eyebrow: entry.eyebrow,
        description: entry.description,
        fieldNote: entry.fieldNote,
        players: entry.players,
        duration: entry.duration,
        controls: entry.controls,
        tags: entry.tags,
        nounId: entry.nounId ?? null,
        screenshot: entry.screenshot ? `https://pointcast.xyz${entry.screenshot}` : null,
      })),
    })),
    beatRunnerArchive: DRUM_RUNNER_EDITIONS.map((edition) => ({
      version: edition.version,
      name: edition.name,
      url: `https://pointcast.xyz${edition.path}`,
      path: edition.path,
      era: edition.year,
      tempo: edition.tempo,
      premise: edition.premise,
      fieldNote: edition.fieldNote,
    })),
    related: {
      fiveGameArcade: "https://pointcast.xyz/drum-games",
      drumHouse: "https://pointcast.xyz/drum",
      windows95Arcade: "https://pointcast.xyz/win95-games",
      playLayer: "https://pointcast.xyz/play",
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
};
