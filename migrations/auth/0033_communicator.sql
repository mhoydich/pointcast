-- Communicator v1-a (docs/prd/communicator-v1.md section 4.1): profiles, games, messages, ledger, okays.
-- payload_json is the private coordination/profile/1 (contact included); public_json is the engine's
-- publicProfile() projection, and every read of someone else's profile selects public_json only.
CREATE TABLE communicator_profiles (
 handle TEXT PRIMARY KEY, user_id TEXT,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 public_json TEXT NOT NULL CHECK(json_valid(public_json)),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX communicator_profiles_user ON communicator_profiles(user_id);
CREATE TABLE communicator_games (
 id TEXT PRIMARY KEY, ladder TEXT NOT NULL, host TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('proposed','inviting','short','filled','confirmed','played','scoring','recorded','disputed','cancelled')),
 state_json TEXT NOT NULL CHECK(json_valid(state_json)),
 slot_start TEXT NOT NULL, slot_end TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX communicator_games_status_slot ON communicator_games(status,slot_start);
CREATE INDEX communicator_games_host ON communicator_games(host,slot_start);
CREATE TABLE communicator_messages (
 id TEXT PRIMARY KEY, game_id TEXT NOT NULL, to_handle TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL,
 replies_json TEXT NOT NULL CHECK(json_valid(replies_json)),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','answered','expired')),
 token_hash TEXT, created_at TEXT NOT NULL, sent_at TEXT, answered_at TEXT, updated_at TEXT NOT NULL
);
CREATE INDEX communicator_messages_game ON communicator_messages(game_id,created_at);
CREATE INDEX communicator_messages_to ON communicator_messages(to_handle,status);
CREATE UNIQUE INDEX communicator_messages_token ON communicator_messages(token_hash);
CREATE TABLE communicator_ledger (
 id TEXT PRIMARY KEY, ladder TEXT NOT NULL, kind TEXT NOT NULL, at TEXT NOT NULL,
 entry_json TEXT NOT NULL CHECK(json_valid(entry_json)),
 status TEXT NOT NULL CHECK(status IN ('pending','confirmed','disputed','void')),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX communicator_ledger_ladder ON communicator_ledger(ladder,created_at);
CREATE TABLE communicator_okays (
 id TEXT PRIMARY KEY, actor TEXT NOT NULL, kind TEXT NOT NULL, target_game TEXT NOT NULL,
 okayed_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX communicator_okays_lookup ON communicator_okays(actor,target_game,okayed_at);
