"""add status to staff_profiles

Revision ID: 78a8e50a98e3
Revises: 865b4a69b22d
Create Date: 2026-09-03 00:39:19.852756

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '78a8e50a98e3'
down_revision: Union[str, Sequence[str], None] = '865b4a69b22d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'staff_profiles',
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
    )
    op.execute("UPDATE staff_profiles SET status = 'offline' WHERE is_available = false")
    op.alter_column('staff_profiles', 'status', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('staff_profiles', 'status')