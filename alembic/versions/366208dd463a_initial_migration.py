"""initial_migration

Revision ID: 366208dd463a
Revises: 
Create Date: 2025-09-16 00:20:36.254578

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = '366208dd463a'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
