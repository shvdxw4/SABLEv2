from pathlib import Path
from sqlalchemy import text
from app.db import engine


def main() -> None:
    migrations_dir = Path(__file__).resolve().parents[1] / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))

    for migration_path in migration_files:
        sql = migration_path.read_text(encoding="utf-8")
        if not sql.strip():
            continue

        print(f"Applying {migration_path.name}...")
        with engine.begin() as conn:
            conn.execute(text(sql))

    print("✅ All migrations applied.")


if __name__ == "__main__":
    main()