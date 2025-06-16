"""Make organization_id nullable in users

Revision ID: e1a12fb5332c
Revises: 2d97c1ab5cee
Create Date: 2025-06-13 17:42:19.012848

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e1a12fb5332c'
down_revision: Union[str, None] = '2d97c1ab5cee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'users',
        'organization_id',
        existing_type=sa.UUID(),
        nullable=True
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'users',
        'organization_id',
        existing_type=sa.UUID(),
        nullable=False
    )
