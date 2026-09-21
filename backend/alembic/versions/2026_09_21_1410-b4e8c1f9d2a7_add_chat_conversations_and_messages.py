"""add_chat_conversations_and_messages

Revision ID: b4e8c1f9d2a7
Revises: a3f9e1b2c8d5
Create Date: 2026-09-21 14:10:00.000000

Adds chat_conversations and chat_messages tables for persisting AI consultation
threads, conversation history per user, and multimodal message logs.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'b4e8c1f9d2a7'
down_revision: Union[str, None] = 'a3f9e1b2c8d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'chat_conversations' not in existing_tables:
        op.create_table(
            'chat_conversations',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index('ix_chat_conversations_id', 'chat_conversations', ['id'])
        op.create_index('ix_chat_conversations_user_id', 'chat_conversations', ['user_id'])
        op.create_index('ix_chat_conversations_updated_at', 'chat_conversations', ['updated_at'])

    if 'chat_messages' not in existing_tables:
        op.create_table(
            'chat_messages',
            sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
            sa.Column('conversation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_conversations.id', ondelete='CASCADE'), nullable=False),
            sa.Column('role', sa.String(length=32), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('image_url', sa.String(length=1024), nullable=True),
            sa.Column('triage_data', sa.JSON(), nullable=True),
            sa.Column('booked_ticket', sa.JSON(), nullable=True),
            sa.Column('suggested_actions', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        )
        op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])
        op.create_index('ix_chat_messages_conversation_id', 'chat_messages', ['conversation_id'])
        op.create_index('ix_chat_messages_created_at', 'chat_messages', ['created_at'])


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    if 'chat_messages' in existing_tables:
        op.drop_index('ix_chat_messages_created_at', table_name='chat_messages')
        op.drop_index('ix_chat_messages_conversation_id', table_name='chat_messages')
        op.drop_index('ix_chat_messages_id', table_name='chat_messages')
        op.drop_table('chat_messages')

    if 'chat_conversations' in existing_tables:
        op.drop_index('ix_chat_conversations_updated_at', table_name='chat_conversations')
        op.drop_index('ix_chat_conversations_user_id', table_name='chat_conversations')
        op.drop_index('ix_chat_conversations_id', table_name='chat_conversations')
        op.drop_table('chat_conversations')
