-- 001_init.sql
-- SABLE Tier-1 Schema Lock (SQL-first)
-- IDs: BIGSERIAL (portable, no extensions)

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('public', 'subscriber', 'creator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CREATOR PROFILES (1:1 with users)
CREATE TABLE IF NOT EXISTS creator_profiles (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(120) NOT NULL,
    bio TEXT,
    avatar_url TEXT
);

-- TRACKS
CREATE TABLE IF NOT EXISTS tracks (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('PUBLIC', 'SUBSCRIBER')) DEFAULT 'PUBLIC',
    state VARCHAR(20) NOT NULL CHECK (state IN ('DRAFT', 'PUBLISHED', 'REMOVED')) DEFAULT 'DRAFT',
    audio_s3_key TEXT,
    artwork_s3_key TEXT,
    duration_sec INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tracks_creator_id ON tracks(creator_id);

-- TRACK TAGS (many tags per track, no duplicates)
CREATE TABLE IF NOT EXISTS track_tags (
    track_id BIGINT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (track_id, tag)
);

-- SUBSCRIPTIONS (1:1 with users)
CREATE TABLE IF NOT EXISTS subscriptions (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'CANCELED', 'EXPIRED')) DEFAULT 'EXPIRED',
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    stripe_customer_id VARCHAR(255),
    stripe_session_id VARCHAR(255)
);