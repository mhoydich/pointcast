-- Private, explicit snapshots; not grades, credentials, voting rights or public profiles.
CREATE TABLE ues_course_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  progress TEXT NOT NULL CHECK (json_valid(progress)),
  revision TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  PRIMARY KEY (user_id, course_code)
);
