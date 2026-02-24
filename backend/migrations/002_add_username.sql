-- 002_add_username.sql
-- T1-3 Schema Alignment: Add username to users

ALTER TABLE users
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Backfill existing rows (if any) with a temporary unique value
UPDATE users
SET username = CONCAT('user_', id)
WHERE username IS NULL;

-- Make username required
ALTER TABLE users
ALTER COLUMN username SET NOT NULL;

-- Enforce uniqueness
ALTER TABLE users
ADD CONSTRAINT users_username_key UNIQUE (username);