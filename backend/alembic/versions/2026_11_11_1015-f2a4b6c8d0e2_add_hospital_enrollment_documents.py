"""add hospital enrollment documents and rejection reason

Revision ID: f2a4b6c8d0e2
Revises: e1f3a2b4c5d6
Create Date: 2026-11-11 10:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "f2a4b6c8d0e2"
down_revision: Union[str, None] = "e1f3a2b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("hospitals", sa.Column("rejection_reason", sa.Text(), nullable=True))

    enrollment_doc_enum = postgresql.ENUM(
        "MOH_LICENSE",
        "BUSINESS_REGISTRATION",
        "REPRESENTATIVE_ID",
        "OTHER",
        name="enrollment_document_type_enum",
        create_type=False,
    )
    enrollment_doc_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "hospital_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "hospital_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("hospitals.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "uploaded_by_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "document_type",
            enrollment_doc_enum,
            nullable=False,
            server_default="MOH_LICENSE",
        ),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("blob_name", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=128), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_hospital_documents_id", "hospital_documents", ["id"])
    op.create_index("ix_hospital_documents_hospital_id", "hospital_documents", ["hospital_id"])


def downgrade() -> None:
    op.drop_index("ix_hospital_documents_hospital_id", table_name="hospital_documents")
    op.drop_index("ix_hospital_documents_id", table_name="hospital_documents")
    op.drop_table("hospital_documents")
    postgresql.ENUM(name="enrollment_document_type_enum").drop(op.get_bind(), checkfirst=True)
    op.drop_column("hospitals", "rejection_reason")

