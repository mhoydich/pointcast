-- Friend Frame v2: a frame your friends program.
-- One frame = seven seats (Mon..Sun). Each seat has a private edit link whose
-- key is derived from the owner key (HMAC) and stored here only as a SHA-256.
-- The owner key itself is never stored, only its hash.
-- Each day's frame is kept as a post: one row per frame per LA calendar date.

CREATE TABLE IF NOT EXISTS friend_frames (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner_hash TEXT NOT NULL,
  creator_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS friend_frames_creator ON friend_frames(creator_hash, created_at);

CREATE TABLE IF NOT EXISTS friend_frame_seats (
  frame_id TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
  friend TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (frame_id, day)
);
CREATE UNIQUE INDEX IF NOT EXISTS friend_frame_seats_key ON friend_frame_seats(key_hash);

CREATE TABLE IF NOT EXISTS friend_frame_posts (
  frame_id TEXT NOT NULL,
  date TEXT NOT NULL,
  day INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
  friend TEXT NOT NULL,
  color TEXT NOT NULL,
  poem TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  picture TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  edits INTEGER NOT NULL DEFAULT 1,
  hidden INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (frame_id, date)
);
CREATE INDEX IF NOT EXISTS friend_frame_posts_seat ON friend_frame_posts(frame_id, day, date);

CREATE TABLE IF NOT EXISTS friend_frame_images (
  id TEXT PRIMARY KEY,
  frame_id TEXT NOT NULL,
  day INTEGER NOT NULL,
  date TEXT NOT NULL,
  mime TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS friend_frame_images_seat ON friend_frame_images(frame_id, day, date);
