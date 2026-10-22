export const GRIDTOWN_VERSION: string;
export const GRIDTOWN_TITLE: string;
export const GRIDTOWN_DESCRIPTION: string;
export const STORAGE_KEY: string;
export const GRID_SIZE: number;
export const MAX_LEVEL: number;
export const STARTING_FUNDS: number;
export const MONTHS: readonly string[];
export const POWER_CAPACITY: number;
export const RESIDENTS_PER_LEVEL: number;
export const UPKEEP: Readonly<{ road: number; park: number; power: number }>;
export const JOBS: Readonly<{ com: number; ind: number }>;

export type TileId = 'grass' | 'water' | 'trees' | 'road' | 'res' | 'com' | 'ind' | 'park' | 'power';
export type ToolId = 'road' | 'res' | 'com' | 'ind' | 'park' | 'power' | 'bulldoze';
export type ZoneId = 'res' | 'com' | 'ind';

export interface TileKind { id: TileId; label: string; terrain: boolean; buildable?: boolean; zone?: boolean }
export const TILES: Readonly<Record<TileId, TileKind>>;

export interface Tool { id: ToolId; label: string; cost: number; key: string; hint: string }
export const TOOLS: readonly Tool[];

export interface Tile { id: TileId; level: number }
export interface Stats {
  population: number; jobs: number; comJobs: number; indJobs: number; capacity: number; powered: number; unpowered: number; unroaded: number;
  pollutedHomes: number; parkedHomes: number; happiness: number; demand: Record<ZoneId, number>; employment: number;
}
export interface LogEntry { month: number; text: string }
export interface City {
  version: 1; name: string; seed: number; month: number; funds: number; taxRate: number;
  tiles: Tile[]; ledger: { income: number; upkeep: number; net: number }; stats: Stats; lessons: string[]; log: LogEntry[];
}
export interface Lesson { id: string; title: string; text: string; done: (city: City) => boolean }
export const LESSONS: readonly Lesson[];

export function mulberry32(seed: number): () => number;
export function index(x: number, y: number): number;
export function inBounds(x: number, y: number): boolean;
export function count(city: City, tileId: TileId): number;
export function normalizeSeed(value: unknown): number;
export function generateTerrain(seed: number): Tile[];
export function createCity(seed?: number, name?: string): City;
export function canBuild(city: City, toolId: string, x: number, y: number): { ok: boolean; reason?: string; cost?: number };
export function build(city: City, toolId: string, x: number, y: number): { city: City; ok: boolean; reason?: string; cost?: number };
export function setTaxRate(city: City, rate: number): City;
export function renameCity(city: City, name: string): City;
export function analyze(city: City): { roaded: boolean[]; powered: boolean[]; pollution: number[]; value: number[]; parkValue: number[]; stats: Stats };
export const JOB_MIX: Readonly<{ com: number; ind: number }>;
export function computeDemand(population: number, comJobs: number, indJobs: number): Record<ZoneId, number>;
export function computeHappiness(input: { population: number; employment: number; parks: number; taxRate: number; homes: number; homePollution: number; homeValue: number }): number;
export function refresh(city: City): City;
export function tick(city: City): City;
export function describeMonth(before: City, after: City, stats: Stats, net: number): string;
export function monthLabel(month: number): string;
export function readCity(raw: unknown): City | null;
export function serializeCity(city: City): string;
export function cityToText(city: City): string;
export function summarizeCity(city: City): Record<string, unknown>;

export interface CityTitle { min: number; title: string }
export const CITY_TITLES: readonly CityTitle[];
export function cityTitle(population: number): string;

export interface TileFact { label: string; ok: boolean; text: string }
export interface TileExplanation { x: number; y: number; id: TileId; label: string; level: number; headline: string; facts: TileFact[]; blocker: string | null; tip: string }
export function explainTile(city: City, x: number, y: number): TileExplanation | null;

export function encodeCity(city: City): string;
export function decodeCity(code: unknown): City | null;
