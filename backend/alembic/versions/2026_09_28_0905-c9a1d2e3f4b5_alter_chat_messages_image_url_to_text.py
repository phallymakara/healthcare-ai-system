"""alter chat_messages image_url column to text

Revision ID: c9a1d2e3f4b5
Revises: 863de1fdac93
Create Date: 2026-09-28 09:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9a1d2e3f4b5'
down_revision: Union[str, None] = '863de1fdac93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'chat_messages',
        'image_url',
        existing_type=sa.String(length=1024),
        type_=sa.Text(),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'chat_messages',
        'image_url',
        existing_type=sa.Text(),
        type_=sa.String(length=1024),
        existing_nullable=True,
    )
