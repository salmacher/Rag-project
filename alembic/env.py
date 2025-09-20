import os
import sys
from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context
from urllib.parse import quote_plus

# Ajoutez le chemin de votre projet au PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configuration Alembic
config = context.config

# Configuration des logs
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Importez vos models pour la metadata
try:
    from app.db.database import Base
    target_metadata = Base.metadata
except ImportError:
    target_metadata = None

def get_database_url():
    """Utilise exactement la même configuration que database.py"""
    password = "salma@123"
    encoded_password = quote_plus(password)
    return f"postgresql://postgres:{encoded_password}@postgres:5432/rag"

def run_migrations_offline():
    """Migrations en mode hors ligne"""
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Migrations en mode connecté"""
    database_url = get_database_url()
    
    connectable = create_engine(
        database_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()