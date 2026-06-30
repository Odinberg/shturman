"""
Alembic migrations for Штурман.
Generates migration scripts without requiring a live database (offline mode).
For online migration execution, set ALEMBIC_ONLINE=1 env var.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path so Alembic can import app modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Alembic Config object
config = context.config

# Set DB URL from app settings (strip async driver for sync alembic)
from app.core.config import settings
sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
config.set_main_option("sqlalchemy.url", sync_url)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Base.metadata is fully populated
from app.core.database import Base
import app.models.models  # noqa: F401

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generate SQL script)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=False,
        as_sql=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connect to live DB)."""
    # Use sync driver; psycopg2 is bundled with asyncpg or use the built-in sqlalchemy driver
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


# Default: offline mode (no DB connection needed)
# Set ALEMBIC_ONLINE=1 to connect to a live database
import os
if os.environ.get("ALEMBIC_ONLINE"):
    run_migrations_online()
else:
    run_migrations_offline()
