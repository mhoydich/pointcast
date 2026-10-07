-- The Desk: Mike's agents trading Mike's own capped bankroll, paper first.
-- Spec: VENUES.md and workers/the-desk/README.md. Only the pointcast-the-desk
-- Worker writes these tables; the /api/the-desk Pages Function reads them.

-- One row. Kill switch, daily halt, and the tick lease.
CREATE TABLE tdesk_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  killed INTEGER NOT NULL DEFAULT 0 CHECK (killed IN (0, 1)),
  killed_at TEXT,
  killed_by TEXT,
  keys_disabled INTEGER NOT NULL DEFAULT 0 CHECK (keys_disabled IN (0, 1)),
  halted_day TEXT,
  halted_at TEXT,
  lock_owner TEXT,
  lock_until INTEGER,
  updated_at TEXT
);
INSERT INTO tdesk_state (id) VALUES (1);

-- Every proposal, refused or not. Reasoning and salt stay private until revealed_at.
CREATE TABLE tdesk_orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  agent TEXT NOT NULL,
  venue TEXT NOT NULL,
  instrument TEXT NOT NULL,
  title TEXT,
  action TEXT NOT NULL, -- as proposed; anything but buy|sell is refused as bad-action
  qty REAL NOT NULL,
  limit_price REAL NOT NULL,
  notional REAL NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('paper', 'live')),
  status TEXT NOT NULL CHECK (status IN ('refused', 'awaiting-approval', 'expired', 'filled', 'partial', 'unfilled', 'canceled')),
  refusal TEXT,
  config_hash TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  salt TEXT,
  commitment TEXT,
  chain TEXT,
  sealed_at TEXT,
  filled_qty REAL NOT NULL DEFAULT 0,
  avg_price REAL,
  fees REAL NOT NULL DEFAULT 0,
  filled_at TEXT,
  reveal_after TEXT,
  revealed_at TEXT,
  flatten INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX tdesk_orders_recent ON tdesk_orders(created_at DESC);
CREATE INDEX tdesk_orders_status ON tdesk_orders(status);
CREATE INDEX tdesk_orders_chain ON tdesk_orders(sealed_at);

-- Long-only lots per agent. Event-contract instruments carry their side (TICKER:yes).
CREATE TABLE tdesk_positions (
  agent TEXT NOT NULL,
  venue TEXT NOT NULL,
  instrument TEXT NOT NULL,
  title TEXT,
  qty REAL NOT NULL CHECK (qty > 0),
  cost REAL NOT NULL,
  opened_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (agent, venue, instrument)
);

-- Paper cash per venue (starts at the venue bankroll).
CREATE TABLE tdesk_cash (
  venue TEXT PRIMARY KEY,
  cash REAL NOT NULL,
  updated_at TEXT NOT NULL
);

-- Realized P&L and fees per agent per venue.
CREATE TABLE tdesk_agent_pnl (
  agent TEXT NOT NULL,
  venue TEXT NOT NULL,
  realized REAL NOT NULL DEFAULT 0,
  fees REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (agent, venue)
);

-- Latest liquidation mark (the bid) per instrument.
CREATE TABLE tdesk_marks (
  venue TEXT NOT NULL,
  instrument TEXT NOT NULL,
  price REAL NOT NULL,
  at TEXT NOT NULL,
  PRIMARY KEY (venue, instrument)
);

-- Equity at the start of each desk day; the daily-loss limit measures from here.
CREATE TABLE tdesk_days (
  day TEXT PRIMARY KEY,
  start_equity REAL NOT NULL,
  last_equity REAL NOT NULL,
  low_equity REAL NOT NULL,
  halted INTEGER NOT NULL DEFAULT 0
);

-- The broadcast log: fills (drum), halts and kills (bell), approvals, reveals.
CREATE TABLE tdesk_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  kind TEXT NOT NULL,
  agent TEXT,
  venue TEXT,
  order_id TEXT,
  detail TEXT
);
CREATE INDEX tdesk_events_recent ON tdesk_events(id DESC);
