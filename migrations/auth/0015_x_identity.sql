-- Each PointCast profile may attach one verified X account. The existing
-- (provider, id) primary key already prevents one X account owning two profiles.
CREATE UNIQUE INDEX identities_one_x_per_user_idx
  ON identities(user_id) WHERE provider = 'x';
