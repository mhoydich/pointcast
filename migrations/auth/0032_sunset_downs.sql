-- Fictional Sunset Downs. Nontransferable free play credits, never redeemable.
CREATE TABLE sunset_downs_stables (
 agent_id TEXT PRIMARY KEY, name TEXT NOT NULL, horse_name TEXT NOT NULL, archetype TEXT NOT NULL,
 owner_label TEXT NOT NULL, balance INTEGER NOT NULL DEFAULT 1000 CHECK(balance>=0),
 starts INTEGER NOT NULL DEFAULT 0 CHECK(starts>=0), wins INTEGER NOT NULL DEFAULT 0 CHECK(wins>=0),
 earned INTEGER NOT NULL DEFAULT 0 CHECK(earned>=0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE sunset_downs_races (
 id TEXT PRIMARY KEY, post_at TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'open' CHECK(state IN ('open','locked','settled')),
 seed TEXT, entrants_json TEXT CHECK(entrants_json IS NULL OR json_valid(entrants_json)),
 result_json TEXT CHECK(result_json IS NULL OR json_valid(result_json)), settled_at TEXT,
 CHECK((state='open' AND seed IS NULL AND entrants_json IS NULL AND result_json IS NULL) OR
 (state='locked' AND seed IS NOT NULL AND entrants_json IS NOT NULL AND result_json IS NULL) OR
 (state='settled' AND seed IS NOT NULL AND entrants_json IS NOT NULL AND result_json IS NOT NULL AND settled_at IS NOT NULL))
);
CREATE INDEX sunset_downs_races_due ON sunset_downs_races(state,post_at);
CREATE TABLE sunset_downs_entries (
 race_id TEXT NOT NULL REFERENCES sunset_downs_races(id), agent_id TEXT NOT NULL REFERENCES sunset_downs_stables(agent_id),
 entered_at TEXT NOT NULL, position INTEGER, award INTEGER NOT NULL DEFAULT 0 CHECK(award>=0),
 PRIMARY KEY(race_id,agent_id)
);
CREATE INDEX sunset_downs_entries_agent ON sunset_downs_entries(agent_id,entered_at DESC);
CREATE TABLE sunset_downs_receipts (
 id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL,
 type TEXT NOT NULL CHECK(type IN ('stable.create','race.enter')), race_id TEXT, delta INTEGER NOT NULL,
 balance_after INTEGER NOT NULL CHECK(balance_after>=0), payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 created_at TEXT NOT NULL, UNIQUE(agent_id,idempotency_key),
 CHECK((type='stable.create' AND delta=1000 AND balance_after=1000 AND race_id IS NULL) OR(type='race.enter' AND delta=-50 AND race_id IS NOT NULL))
);
CREATE INDEX sunset_downs_receipts_agent ON sunset_downs_receipts(agent_id,created_at DESC);
CREATE TRIGGER sunset_downs_receipt_guard BEFORE INSERT ON sunset_downs_receipts BEGIN
 SELECT CASE WHEN NEW.type='stable.create' AND EXISTS(SELECT 1 FROM sunset_downs_stables WHERE agent_id=NEW.agent_id) THEN RAISE(ABORT,'sunset-stable-exists') END;
 SELECT CASE WHEN NEW.type='race.enter' AND NOT EXISTS(SELECT 1 FROM sunset_downs_stables WHERE agent_id=NEW.agent_id) THEN RAISE(ABORT,'sunset-stable-required') END;
 SELECT CASE WHEN NEW.type='race.enter' AND NOT EXISTS(SELECT 1 FROM sunset_downs_races WHERE id=NEW.race_id AND state='open' AND post_at>NEW.created_at AND post_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')) THEN RAISE(ABORT,'sunset-entry-closed') END;
 SELECT CASE WHEN NEW.type='race.enter' AND EXISTS(SELECT 1 FROM sunset_downs_entries WHERE race_id=NEW.race_id AND agent_id=NEW.agent_id) THEN RAISE(ABORT,'sunset-already-entered') END;
 SELECT CASE WHEN NEW.type='race.enter' AND (SELECT COUNT(*) FROM sunset_downs_entries WHERE race_id=NEW.race_id)>=12 THEN RAISE(ABORT,'sunset-field-full') END;
 SELECT CASE WHEN NEW.type='race.enter' AND (SELECT balance FROM sunset_downs_stables WHERE agent_id=NEW.agent_id)<50 THEN RAISE(ABORT,'sunset-insufficient-credits') END;
 SELECT CASE WHEN NEW.type='race.enter' AND NEW.balance_after!=(SELECT balance-50 FROM sunset_downs_stables WHERE agent_id=NEW.agent_id) THEN RAISE(ABORT,'sunset-balance-conflict') END;
END;
CREATE TRIGGER sunset_downs_receipt_apply AFTER INSERT ON sunset_downs_receipts BEGIN
 INSERT INTO sunset_downs_stables(agent_id,name,horse_name,archetype,owner_label,created_at,updated_at)
 SELECT NEW.agent_id,json_extract(NEW.payload_json,'$.name'),json_extract(NEW.payload_json,'$.horseName'),json_extract(NEW.payload_json,'$.archetype'),json_extract(NEW.payload_json,'$.ownerLabel'),NEW.created_at,NEW.created_at WHERE NEW.type='stable.create';
 INSERT INTO sunset_downs_entries(race_id,agent_id,entered_at) SELECT NEW.race_id,NEW.agent_id,NEW.created_at WHERE NEW.type='race.enter';
 UPDATE sunset_downs_stables SET balance=balance-50, starts=starts+1, updated_at=NEW.created_at WHERE NEW.type='race.enter' AND agent_id=NEW.agent_id;
END;
-- A race closes and freezes its field before calculation. Once settled, it is immutable.
CREATE TRIGGER sunset_downs_race_guard BEFORE UPDATE ON sunset_downs_races BEGIN
 SELECT CASE WHEN OLD.state='settled' OR NOT((OLD.state='open' AND NEW.state='locked') OR(OLD.state='locked' AND NEW.state='settled')) THEN RAISE(ABORT,'sunset-race-immutable') END;
 SELECT CASE WHEN NEW.id!=OLD.id OR NEW.post_at!=OLD.post_at OR (OLD.state='locked' AND (NEW.seed!=OLD.seed OR NEW.entrants_json!=OLD.entrants_json)) THEN RAISE(ABORT,'sunset-race-snapshot-immutable') END;
END;
CREATE TRIGGER sunset_downs_race_reward AFTER UPDATE OF state ON sunset_downs_races WHEN OLD.state='locked' AND NEW.state='settled' BEGIN
 UPDATE sunset_downs_entries SET
 position=(SELECT json_extract(value,'$.position') FROM json_each(NEW.result_json,'$.finish') WHERE json_extract(value,'$.id')=agent_id),
 award=COALESCE((SELECT json_extract(value,'$.award') FROM json_each(NEW.result_json,'$.finish') WHERE json_extract(value,'$.id')=agent_id),0)
 WHERE race_id=NEW.id;
 UPDATE sunset_downs_stables SET
 balance=balance+COALESCE((SELECT award FROM sunset_downs_entries WHERE race_id=NEW.id AND agent_id=sunset_downs_stables.agent_id),0),
 earned=earned+COALESCE((SELECT award FROM sunset_downs_entries WHERE race_id=NEW.id AND agent_id=sunset_downs_stables.agent_id),0),
 wins=wins+CASE WHEN EXISTS(SELECT 1 FROM sunset_downs_entries WHERE race_id=NEW.id AND agent_id=sunset_downs_stables.agent_id AND position=1) THEN 1 ELSE 0 END,
 updated_at=NEW.settled_at WHERE agent_id IN (SELECT agent_id FROM sunset_downs_entries WHERE race_id=NEW.id);
END;
