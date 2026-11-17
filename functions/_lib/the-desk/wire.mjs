// The Desk — wiring: config + store + paper adapters + sealer → the gate.
// Shared by the Worker (workers/the-desk) and the tests.
import { configHash as hashConfig, loadConfig } from './config.mjs';
import { createDesk } from './gate.mjs';
import { localSealer, wildSealer } from './seal.mjs';
import { deskStore } from './store.mjs';
import { STRATEGIES } from './strategies.mjs';
import { alpacaData, kalshiData, kalshiFee, paperAdapter, parseAlpacaInstrument, parseKalshiInstrument } from './venues.mjs';

export const INSTRUMENTS = {
  kalshi: { parse: parseKalshiInstrument },
  'polymarket-us': { parse: () => null },
  alpaca: { parse: parseAlpacaInstrument },
};

/**
 * @param {object} o
 * @param {object} o.rawConfig      src/data/the-desk.json
 * @param {D1Database} o.db
 * @param {{ALPACA_DATA_KEY_ID?: string, ALPACA_DATA_SECRET?: string}} [o.secrets]  market-data keys only; no trading keys exist in paper mode
 * @param {typeof fetch} [o.fetchImpl]
 * @param {(msg: object) => Promise<void>} [o.notify]
 * @param {() => number} [o.now]
 * @param {object} [o.data]       test doubles for { kalshi, alpaca } market data
 * @param {object} [o.overrides]  test-only createDesk overrides (sealer, adapters, lockRetries, sleep)
 */
export async function wireDesk({ rawConfig, db, secrets = {}, fetchImpl = fetch, notify, now = Date.now, data = null, overrides = {} }) {
  const config = loadConfig(rawConfig);
  const configHash = await hashConfig(config);
  const store = deskStore(db);
  const kalshi = data?.kalshi ?? kalshiData(fetchImpl);
  const alpaca = data?.alpaca ?? alpacaData({ keyId: secrets.ALPACA_DATA_KEY_ID, secret: secrets.ALPACA_DATA_SECRET, fetchImpl });

  const adapters = {};
  const v = config.venues;
  if (v.kalshi?.enabled && v.kalshi.mode === 'paper') adapters.kalshi = paperAdapter({ venue: 'kalshi', kind: 'event', data: kalshi, fee: kalshiFee });
  if (v.alpaca?.enabled && v.alpaca.mode === 'paper' && alpaca.configured !== false) adapters.alpaca = paperAdapter({ venue: 'alpaca', kind: 'equity', data: alpaca });
  // polymarket-us: no adapter until VENUES.md's confirm items clear.

  const sealer = config.mode === 'paper' ? localSealer : wildSealer;
  const desk = createDesk({ config, configHash, store, adapters, sealer, instruments: INSTRUMENTS, notify, now, ...overrides, adapters: overrides.adapters ?? adapters });

  // What strategies may see: listings, quotes and closes. No place, no cancel.
  const view = {
    kalshi: { listOpen: (opts) => (adapters.kalshi ? kalshi.listOpen(opts) : []) },
    alpaca: { dailyCloses: (sym, n, ms) => (adapters.alpaca ? alpaca.dailyCloses(sym, n, ms) : []) },
    quote: (venue, instrument) => (adapters[venue] ? adapters[venue].quote(instrument, now()) : null),
    symbols: adapters.alpaca ? [...(v.alpaca.symbols || [])] : [],
  };
  const strategies = STRATEGIES.filter((s) => {
    const agent = config.agents.find((a) => a.id === s.id);
    return agent && adapters[agent.venue];
  });

  return { config, configHash, store, desk, view, strategies };
}
