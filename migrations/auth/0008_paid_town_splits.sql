PRAGMA foreign_keys = ON;

CREATE TABLE splits (
  receipt_hash TEXT PRIMARY KEY CHECK (length(receipt_hash) = 64),
  action TEXT NOT NULL,
  amount_units INTEGER NOT NULL CHECK (amount_units > 0),
  house_units INTEGER NOT NULL CHECK (house_units >= 0),
  network_units INTEGER NOT NULL CHECK (network_units >= 0),
  maker TEXT NOT NULL,
  maker_address TEXT,
  settled_at TEXT NOT NULL,
  CHECK (house_units + network_units = amount_units)
);

CREATE INDEX splits_action_settled_idx ON splits(action, settled_at DESC);
CREATE INDEX splits_maker_settled_idx ON splits(maker, settled_at DESC);
