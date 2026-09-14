export type HumanCardId = 'ember' | 'root' | 'focus';
export type SupportCardId = 'echo' | 'ward' | 'mend';
export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
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
  humanDamage: number;
  block: number;
  healing: number;
  incoming: number;
  taken: number;
  wastedBlock: number;
  wastedHeal: number;
}

export function initial(): GameState;
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
  readonly threats: readonly number[];
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
