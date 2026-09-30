-- Death Star Computer Club. Membership is explicitly requested by a signed-in
-- PointCast user. Public endpoints never expose account IDs or identities.
CREATE TABLE IF NOT EXISTS atari_club_members (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL CHECK (length(handle) BETWEEN 3 AND 20),
  handle_key TEXT NOT NULL UNIQUE,
  joined_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  first_post_at INTEGER,
  first_workshop_at INTEGER,
  night_shift_at INTEGER
);
CREATE TABLE IF NOT EXISTS atari_club_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES atari_club_members(user_id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('general', 'memories', 'workshop')),
  body TEXT NOT NULL CHECK (length(body) <= 1000),
  created_at INTEGER NOT NULL,
  removed INTEGER NOT NULL DEFAULT 0 CHECK (removed IN (0, 1))
);
CREATE INDEX IF NOT EXISTS atari_club_posts_feed ON atari_club_posts(channel, removed, created_at DESC);
CREATE INDEX IF NOT EXISTS atari_club_posts_user ON atari_club_posts(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS atari_club_checkins (
  user_id TEXT NOT NULL REFERENCES atari_club_members(user_id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, day)
);
CREATE TABLE IF NOT EXISTS atari_club_reports (
  post_id TEXT NOT NULL REFERENCES atari_club_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES atari_club_members(user_id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'abuse', 'privacy', 'other')),
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  PRIMARY KEY (post_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS atari_club_reports_reporter ON atari_club_reports(reporter_id, created_at);
CREATE INDEX IF NOT EXISTS atari_club_reports_open ON atari_club_reports(resolved_at, created_at DESC);
