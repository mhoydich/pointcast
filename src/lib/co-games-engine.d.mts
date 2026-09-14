export type HumanCardId = 'ember' | 'root' | 'focus';
export type SupportCardId = 'echo' | 'ward' | 'mend';
export type GameStatus = 'playing' | 'won' | 'lost';
export type EncounterId = 'classic' | 'garden' | 'rush' | 'shell' | 'storm';

export interface Encounter {
  readonly id: EncounterId;
  readonly name: string;
  readonly enemy: number;
  readonly threats: readonly number[];
  readonly armor: readonly number[];
  readonly combos: boolean;
}
export interface ComboDefinition {
  readonly human: HumanCardId;
  readonly support: SupportCardId;
  readonly name: string;
  readonly description: string;
  readonly bonusDamage: number;
  readonly bonusHealing: number;
}
export type ComboId = 'ember:echo' | 'root:ward' | 'focus:mend';
export const encounters: Readonly<Record<EncounterId, Encounter>>;
export const combos: Readonly<Record<ComboId, ComboDefinition>>;

export interface GameState {
  /** Omitted only in older classic snapshots. New states always include this. */
  encounter?: EncounterId;
  /** Zero-based turn index; also the observation revision. */
  round: number;
  hp: number;
  enemy: number;
  focused: boolean;
  ember: number;
  focus: number;
  echo: number;
  ward: number;
  mend: number;
  status: GameStatus;
}

export interface HumanCard { readonly name: string; readonly damage: number; readonly block: number }
export interface SupportCard extends HumanCard { readonly heal: number }
export const threats: readonly number[];
export const human: Readonly<Record<HumanCardId, HumanCard>>;
export const partner: Readonly<Record<SupportCardId, SupportCard>>;

export interface Forecast {
  state: GameState;
  damage: number;
  rawDamage: number;
  /** Damage removed by this round's armor, capped at rawDamage. */
  armor: number;
  combo: Readonly<{ name: string; description: string }> | null;
  humanDamage: number;
  block: number;
  healing: number;
  incoming: number;
  taken: number;
  wastedBlock: number;
  wastedHeal: number;
}

export function initial(encounterId?: EncounterId): GameState;
export function encounterFor(state: Readonly<GameState>): Encounter | null;
export function currentIntent(state: Readonly<GameState>): { attack: number; armor: number } | null;
export function legalHuman(state: Readonly<GameState>): HumanCardId[];
export function legalPartner(state: Readonly<GameState>): SupportCardId[];
export function simulate(state: Readonly<GameState>, humanId: string, supportId: string): Forecast | null;
export function score(state: Readonly<GameState>): number;
export function choose(state: Readonly<GameState>, humanId: string): SupportCardId | null;

export interface MatchObservation {
  readonly protocol: 'pointcast.co-games.v1';
  /** Unique per playthrough, including replays. */
  readonly gameId: string;
  readonly revision: number;
  readonly selectedHuman: HumanCardId;
  readonly state: Readonly<GameState>;
  readonly encounter: Encounter;
  readonly threats: readonly number[];
  readonly armor: readonly number[];
  readonly combos: Readonly<Partial<Record<ComboId, ComboDefinition>>>;
  readonly legalSupports: readonly SupportCardId[];
  readonly cards: Readonly<{ human: typeof human; partner: typeof partner }>;
}

export interface SupportResponse {
  gameId: string;
  revision: number;
  selectedHuman: HumanCardId;
  support: SupportCardId;
  /** Optional explanation for the human; never interpreted as an action. */
  reason?: string;
}

export type SupportValidation = { ok: true; support: SupportCardId } | {
  ok: false;
  reason: 'inactive-game' | 'invalid-response' | 'game-mismatch' | 'stale-revision' | 'selection-mismatch' | 'illegal-support';
};

export function observe(state: Readonly<GameState>, selectedHuman: HumanCardId, gameId: string): MatchObservation;
/** Pass an observation freshly created from current state when the response arrives. */
export function validateSupportResponse(observation: MatchObservation, response: unknown): SupportValidation;
