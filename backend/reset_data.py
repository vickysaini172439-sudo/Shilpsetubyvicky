"""
Wipes all artisan-created data and returns ShilpSetu to a fresh state.

Deletes: accounts, businesses, products, saved pricing calculations,
AI business-manager chat history, and every uploaded photo/logo.
Keeps:   the reference market pricing data the app seeds by itself, and
         of course all of your code.

Run it with reset_app.bat, or directly:  python reset_data.py
"""

import os
import sqlite3

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(HERE, "app.db")
UPLOADS = os.path.join(HERE, "uploads")

USER_TABLES = ["chat_messages", "pricing_records", "products", "businesses", "users"]


def clear_database():
    if not os.path.exists(DB):
        print("No database file yet - nothing to clear. It will be created fresh on the next start.")
        return

    conn = sqlite3.connect(DB, timeout=10)
    existing = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}

    for table in USER_TABLES:
        if table in existing:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            conn.execute(f"DELETE FROM {table}")
            print(f"  cleared {table} ({count} removed)")

    # restart id numbering from 1 so the fresh app really looks fresh
    if "sqlite_sequence" in existing:
        placeholders = ",".join("?" for _ in USER_TABLES)
        conn.execute(f"DELETE FROM sqlite_sequence WHERE name IN ({placeholders})", USER_TABLES)

    conn.commit()
    conn.execute("VACUUM")  # shrink the file back down
    conn.close()


def clear_uploads():
    removed = 0
    for folder in ("products", "logos"):
        path = os.path.join(UPLOADS, folder)
        if not os.path.isdir(path):
            continue
        for name in os.listdir(path):
            if name == ".gitkeep":
                continue
            try:
                os.remove(os.path.join(path, name))
                removed += 1
            except OSError as exc:
                print(f"  could not delete {name}: {exc}")
    print(f"  removed {removed} uploaded file(s)")


if __name__ == "__main__":
    print("Clearing database...")
    clear_database()
    print("Clearing uploaded images...")
    clear_uploads()
    print("\nShilpSetu is now a fresh application.")
