CREATE TABLE IF NOT EXISTS rsvps (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name  TEXT NOT NULL,
  email      TEXT NOT NULL,
  num_guests TEXT NOT NULL,
  events     TEXT NOT NULL,
  dietary    TEXT DEFAULT '',
  message    TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rsvps_email ON rsvps(email);

CREATE TABLE IF NOT EXISTS site_config (
  id         INTEGER PRIMARY KEY CHECK (id = 1),
  config     TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
