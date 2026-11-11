"""add user terms agreement columns

Revision ID: e1f3a2b4c5d6
Revises: d8e2f1a4b7c9
Create Date: 2026-11-11 09:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1f3a2b4c5d6"
down_revision: Union[str, None] = "d8e2f1a4b7c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("terms_accepted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("users", sa.Column("terms_accepted_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("terms_version", sa.String(length=32), nullable=True))
    op.add_column("users", sa.Column("terms_audience", sa.String(length=32), nullable=True))

    # Backfill existing accounts so only newly created users are required to accept Terms & Conditions
    op.execute(
        """
        UPDATE users
        SET
            terms_accepted = true,
            terms_accepted_at = COALESCE(created_at, NOW()),
            terms_version = '1.0',
            terms_audience = CASE
                WHEN role::text = 'PATIENT' THEN 'PATIENT'
                ELSE 'PARTNER'
            END
        WHERE terms_accepted = false
        """
    )


def downgrade() -> None:
    op.drop_column("users", "terms_audience")
    op.drop_column("users", "terms_version")
    op.drop_column("users", "terms_accepted_at")
    op.drop_column("users", "terms_accepted")

