"""
A very small, safe "migration" helper.

SQLAlchemy's create_all() can CREATE new tables, but it will never ADD a
new column to a table that already exists. So when we add a field to a
model, an existing app.db would keep the old shape and every query would
fail with "no such column".

This runs on startup, looks at what columns each table actually has, and
adds any that are missing. It never drops or rewrites anything, so no
existing data is lost.
"""

from sqlalchemy import inspect, text


def _existing_columns(connection, table_name):
    return {row[1] for row in connection.execute(text(f"PRAGMA table_info({table_name})"))}


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
            have = _existing_columns(connection, table)
            for column, sql_type in columns.items():
                if column not in have:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                    print(f"[migration] added column {table}.{column}")
