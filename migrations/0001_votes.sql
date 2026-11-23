CREATE TABLE votes (
  ip_hash TEXT NOT NULL,
  slug TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (ip_hash, slug)
) WITHOUT ROWID;

CREATE INDEX votes_ip_day ON votes (ip_hash, day);
