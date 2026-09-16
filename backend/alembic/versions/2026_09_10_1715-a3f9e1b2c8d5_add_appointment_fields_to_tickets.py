"""add_appointment_fields_to_tickets

Revision ID: a3f9e1b2c8d5
Revises: c5df6da040e4
Create Date: 2026-09-10 17:15:00.000000

Adds appointment_date (Date) and appointment_time (String) columns to the
tickets table. These columns were added to the SQLAlchemy model after the
initial migration was created, causing UndefinedColumnError in production.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3f9e1b2c8d5'
down_revision: Union[str, None] = 'c5df6da040e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('tickets')]

    if 'appointment_date' not in existing_columns:
        op.add_column(
            'tickets',
            sa.Column('appointment_date', sa.Date(), nullable=True)
        )
    if 'appointment_time' not in existing_columns:
        op.add_column(
            'tickets',
            sa.Column('appointment_time', sa.String(length=32), nullable=True)
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [col['name'] for col in inspector.get_columns('tickets')]

    if 'appointment_time' in existing_columns:
        op.drop_column('tickets', 'appointment_time')
    if 'appointment_date' in existing_columns:
        op.drop_column('tickets', 'appointment_date')
