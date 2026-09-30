-- Free Lucky Cat practice ledger. Submitted evidence is self-reported.
-- Receipt, balance, cap, collection, and task effects commit atomically.
CREATE TABLE lucky_cat_profiles (
  agent_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_points INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_points >= 0),
  completed_tasks INTEGER NOT NULL DEFAULT 0 CHECK (completed_tasks >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE lucky_cat_tasks (
  agent_id TEXT NOT NULL REFERENCES lucky_cat_profiles(agent_id),
  task_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('planned','delivered','verified','reflected')),
  goal TEXT NOT NULL,
  plan_json TEXT NOT NULL CHECK (json_valid(plan_json)),
  delivery_json TEXT CHECK (delivery_json IS NULL OR json_valid(delivery_json)),
  verification_json TEXT CHECK (verification_json IS NULL OR json_valid(verification_json)),
  reflection_json TEXT CHECK (reflection_json IS NULL OR json_valid(reflection_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (agent_id, task_id)
);
CREATE INDEX lucky_cat_tasks_recent ON lucky_cat_tasks(agent_id, updated_at DESC);
CREATE TABLE lucky_cat_receipts (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES lucky_cat_profiles(agent_id),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task.start','task.deliver','task.verify','task.reflect','cat.collect','charm.use')),
  task_id TEXT,
  cat_id TEXT,
  charm_id TEXT,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  lifetime_after INTEGER NOT NULL CHECK (lifetime_after >= 0),
  completed_tasks_after INTEGER NOT NULL CHECK (completed_tasks_after >= 0),
  day TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  guidance_json TEXT CHECK (guidance_json IS NULL OR json_valid(guidance_json)),
  created_at TEXT NOT NULL,
  UNIQUE (agent_id, idempotency_key),
  CHECK (
    (type='task.start' AND delta BETWEEN 0 AND 3 AND task_id IS NOT NULL AND cat_id IS NULL AND charm_id IS NULL) OR
    (type='task.deliver' AND delta BETWEEN 0 AND 5 AND task_id IS NOT NULL AND cat_id IS NULL AND charm_id IS NULL) OR
    (type='task.verify' AND delta BETWEEN 0 AND 8 AND task_id IS NOT NULL AND cat_id IS NULL AND charm_id IS NULL) OR
    (type='task.reflect' AND delta BETWEEN 0 AND 4 AND task_id IS NOT NULL AND cat_id IS NULL AND charm_id IS NULL) OR
    (type='cat.collect' AND delta <= 0 AND task_id IS NULL AND cat_id IS NOT NULL AND charm_id IS NULL) OR
    (type='charm.use' AND delta < 0 AND task_id IS NULL AND cat_id IS NULL AND charm_id IS NOT NULL)
  )
);
CREATE INDEX lucky_cat_receipts_daily ON lucky_cat_receipts(agent_id, day);
CREATE INDEX lucky_cat_receipts_recent ON lucky_cat_receipts(agent_id, created_at DESC);
CREATE UNIQUE INDEX lucky_cat_task_phase_once ON lucky_cat_receipts(agent_id, task_id, type) WHERE task_id IS NOT NULL;
CREATE TABLE lucky_cat_collection (
  agent_id TEXT NOT NULL REFERENCES lucky_cat_profiles(agent_id),
  cat_id TEXT NOT NULL,
  receipt_id TEXT NOT NULL UNIQUE REFERENCES lucky_cat_receipts(id),
  collected_at TEXT NOT NULL,
  PRIMARY KEY (agent_id, cat_id)
);
CREATE TRIGGER lucky_cat_receipt_guard BEFORE INSERT ON lucky_cat_receipts BEGIN
  SELECT CASE WHEN (SELECT COUNT(*) FROM lucky_cat_receipts WHERE agent_id=NEW.agent_id AND day=NEW.day) >= 64
    THEN RAISE(ABORT,'lucky-cat-action-limit') END;
  SELECT CASE WHEN NEW.type='task.start' AND (SELECT COUNT(*) FROM lucky_cat_tasks WHERE agent_id=NEW.agent_id AND phase!='reflected') >= 12
    THEN RAISE(ABORT,'lucky-cat-active-task-limit') END;
  SELECT CASE WHEN NEW.type='task.start' AND (SELECT COUNT(*) FROM lucky_cat_receipts WHERE agent_id=NEW.agent_id AND day=NEW.day AND type='task.start') >= 3
    THEN RAISE(ABORT,'lucky-cat-task-limit') END;
  SELECT CASE WHEN NEW.type='task.start' AND EXISTS(SELECT 1 FROM lucky_cat_tasks WHERE agent_id=NEW.agent_id AND task_id=NEW.task_id)
    THEN RAISE(ABORT,'lucky-cat-phase-conflict') END;
  SELECT CASE WHEN NEW.type='task.deliver' AND NOT EXISTS(SELECT 1 FROM lucky_cat_tasks WHERE agent_id=NEW.agent_id AND task_id=NEW.task_id AND phase='planned')
    THEN RAISE(ABORT,'lucky-cat-phase-conflict') END;
  SELECT CASE WHEN NEW.type='task.verify' AND NOT EXISTS(SELECT 1 FROM lucky_cat_tasks WHERE agent_id=NEW.agent_id AND task_id=NEW.task_id AND phase='delivered')
    THEN RAISE(ABORT,'lucky-cat-phase-conflict') END;
  SELECT CASE WHEN NEW.type='task.reflect' AND NOT EXISTS(SELECT 1 FROM lucky_cat_tasks WHERE agent_id=NEW.agent_id AND task_id=NEW.task_id AND phase='verified')
    THEN RAISE(ABORT,'lucky-cat-phase-conflict') END;
  SELECT CASE WHEN NEW.type='cat.collect' AND EXISTS(SELECT 1 FROM lucky_cat_collection WHERE agent_id=NEW.agent_id AND cat_id=NEW.cat_id)
    THEN RAISE(ABORT,'lucky-cat-already-owned') END;
  SELECT CASE WHEN COALESCE((SELECT balance FROM lucky_cat_profiles WHERE agent_id=NEW.agent_id),0)+NEW.delta < 0
    THEN RAISE(ABORT,'lucky-cat-insufficient-luck') END;
  SELECT CASE WHEN NEW.delta > 0 AND NEW.delta+COALESCE((SELECT SUM(delta) FROM lucky_cat_receipts WHERE agent_id=NEW.agent_id AND day=NEW.day AND delta>0),0)>60
    THEN RAISE(ABORT,'lucky-cat-daily-cap') END;
END;
CREATE TRIGGER lucky_cat_receipt_apply AFTER INSERT ON lucky_cat_receipts BEGIN
  UPDATE lucky_cat_profiles SET balance=balance+NEW.delta,
    lifetime_points=lifetime_points+MAX(NEW.delta,0),
    completed_tasks=completed_tasks+CASE WHEN NEW.type='task.reflect' THEN 1 ELSE 0 END,
    updated_at=NEW.created_at WHERE agent_id=NEW.agent_id;
  INSERT INTO lucky_cat_tasks (agent_id,task_id,phase,goal,plan_json,created_at,updated_at)
    SELECT NEW.agent_id,NEW.task_id,'planned',json_extract(NEW.payload_json,'$.goal'),
      json_extract(NEW.payload_json,'$.plan'),NEW.created_at,NEW.created_at WHERE NEW.type='task.start';
  UPDATE lucky_cat_tasks SET phase='delivered',
    delivery_json=json_object('summary',json_extract(NEW.payload_json,'$.summary'),'evidence',json(json_extract(NEW.payload_json,'$.evidence'))),
    updated_at=NEW.created_at WHERE NEW.type='task.deliver' AND agent_id=NEW.agent_id AND task_id=NEW.task_id;
  UPDATE lucky_cat_tasks SET phase='verified',
    verification_json=json_object('checks',json(json_extract(NEW.payload_json,'$.checks')),'limitation',json_extract(NEW.payload_json,'$.limitation')),
    updated_at=NEW.created_at WHERE NEW.type='task.verify' AND agent_id=NEW.agent_id AND task_id=NEW.task_id;
  UPDATE lucky_cat_tasks SET phase='reflected',
    reflection_json=json_object('lesson',json_extract(NEW.payload_json,'$.lesson'),'nextStep',json_extract(NEW.payload_json,'$.nextStep')),
    updated_at=NEW.created_at WHERE NEW.type='task.reflect' AND agent_id=NEW.agent_id AND task_id=NEW.task_id;
  INSERT INTO lucky_cat_collection (agent_id,cat_id,receipt_id,collected_at)
    SELECT NEW.agent_id,NEW.cat_id,NEW.id,NEW.created_at WHERE NEW.type='cat.collect';
END;
