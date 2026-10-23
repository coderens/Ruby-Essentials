CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(80) NOT NULL,
  in_game_name VARCHAR(80),
  clan_role VARCHAR(40) NOT NULL DEFAULT 'Member',
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'Community',
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'upcoming',
  starts_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS join_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL,
  in_game_name VARCHAR(80),
  message TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clan_members_public ON clan_members (is_public, joined_at);
CREATE INDEX IF NOT EXISTS idx_clan_events_starts_at ON clan_events (starts_at);