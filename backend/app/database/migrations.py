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

# Binary columns are the one type whose SQL name genuinely differs between
# the two databases this app runs against. Everything else in `wanted`
# below is a plain string; this is a dict, and the loop picks the spelling
# that matches whichever engine is connected.
BINARY = {"postgresql": "BYTEA", "sqlite": "BLOB"}


def run_migrations(engine):
    # table -> {column name: SQL type to add it with}
    wanted = {
        "users": {
            "security_question": "VARCHAR",
            "security_answer_hash": "VARCHAR",
        },
        # Catalogue richness for the public storefront. All nullable, so
        # every existing product keeps working untouched and simply has
        # nothing extra to show until the artisan fills it in.
        "products": {
            "features": "TEXT",
            "caption": "TEXT",
            "stock_quantity": "INTEGER",
            # Photos moved off the filesystem and into the database,
            # because Render rebuilds the filesystem on every deploy and
            # destroyed every uploaded image. See services/stored_image.py.
            "image_data": BINARY,
            "image_mime": "VARCHAR",
        },
        "businesses": {
            "logo_data": BINARY,
            "logo_mime": "VARCHAR",
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
                if column in have:
                    continue
                # A dict means the type is spelled differently per database
                # (see BINARY above). Fall back to the Postgres spelling for
                # any engine we have not named, since that is what is
                # deployed - failing loudly on an unknown engine would be
                # worse than trying the most likely answer.
                if isinstance(sql_type, dict):
                    sql_type = sql_type.get(engine.dialect.name, sql_type["postgresql"])
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                print(f"[migration] added column {table}.{column} ({sql_type})")
