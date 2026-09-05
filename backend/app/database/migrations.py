"""
A very small, safe "migration" helper.

SQLAlchemy's create_all() can CREATE new tables, but it will never ADD a
new column to a table that already exists. So when we add a field to a
model, an existing database would keep the old shape and every query
would fail with "no such column".

This runs on startup, looks at what columns each table actually has, and
adds any that are missing. It never drops or rewrites anything, so no
existing data is lost.

IMPORTANT: this has to work on BOTH databases the app can run against -
SQLite (offline local development) and Postgres/Supabase (deployed). It
therefore asks SQLAlchemy's inspector for the column list rather than
running SQLite's own "PRAGMA table_info", which is not valid SQL on
Postgres and crashed the deployed backend on startup.
"""

from sqlalchemy import inspect, text


def run_migrations(engine):
    # table -> {column name: SQL type to add it with}
    wanted = {
        "users": {
            "security_question": "VARCHAR",
            "security_answer_hash": "VARCHAR",
        },
    }

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as connection:
        for table, columns in wanted.items():
            if table not in existing_tables:
                continue  # create_all() will build it fresh with every column

            # Works identically on SQLite and Postgres.
            have = {column["name"] for column in inspector.get_columns(table)}

            for column, sql_type in columns.items():
                if column not in have:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                    print(f"[migration] added column {table}.{column}")
