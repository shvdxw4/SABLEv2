print("Running migration script...")

from pathlib import Path
from sqlalchemy import text

from app.db import engine

def main() -> None:
    migration_path = Path(__file__).resolve().parents[1] / "migrations" / "001_init.sql"
    sql = migration_path.read_text(encoding="utf-8")

    with engine.begin() as conn:
        conn.execute(text(sql))

    print("✅ Applied migration: 001_init.sql")

if __name__ == "__main__":
    main()