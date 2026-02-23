from sqlalchemy import text
from app.db import engine

def main() -> None:
    with engine.begin() as conn:
        # 1) Create a creator user
        user_id = conn.execute(text("""
            INSERT INTO users (email, password_hash, role)
            VALUES ('creator1@sable.dev', 'dev_hash', 'creator')
            ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role
            RETURNING id;
        """)).scalar_one()

        # 2) Ensure creator profile exists
        conn.execute(text("""
            INSERT INTO creator_profiles (user_id, display_name, bio, avatar_url)
            VALUES (:uid, 'Creator One', 'Seed creator profile', NULL)
            ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name;
        """), {"uid": user_id})

        # 3) Create a draft track
        track_id = conn.execute(text("""
            INSERT INTO tracks (creator_id, title, tier, state)
            VALUES (:uid, 'Draft Track One', 'PUBLIC', 'DRAFT')
            RETURNING id;
        """), {"uid": user_id}).scalar_one()

        # 4) Query it back (exit proof)
        row = conn.execute(text("""
            SELECT t.id, t.title, t.tier, t.state, u.email
            FROM tracks t
            JOIN users u ON u.id = t.creator_id
            WHERE t.id = :tid;
        """), {"tid": track_id}).mappings().one()

    print("✅ Exit proof row:", dict(row))

if __name__ == "__main__":
    main()