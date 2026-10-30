"""Initial schema: users, parcels, tracking_logs

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-28
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

USER_ROLE = sa.Enum("ADMIN", "DRIVER", "CUSTOMER", name="userrole", native_enum=False, length=20)
PARCEL_STATUS = sa.Enum(
    "CREATED",
    "PICKED_UP",
    "IN_TRANSIT",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "FAILED",
    "CANCELLED",
    name="parcelstatus",
    native_enum=False,
    length=20,
)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("user_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", USER_ROLE, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_role", "users", ["role"])

    op.create_table(
        "parcels",
        sa.Column("tracking_number", sa.String(24), primary_key=True, nullable=False),
        sa.Column("sender_id", sa.Integer(), nullable=False),
        sa.Column("receiver_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Numeric(8, 2), nullable=False),
        sa.Column("pickup_address", sa.String(255), nullable=False),
        sa.Column("delivery_address", sa.String(255), nullable=False),
        sa.Column("status", PARCEL_STATUS, nullable=False, server_default="CREATED"),
        sa.Column("estimated_delivery", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["sender_id"], ["users.user_id"], name="fk_parcels_sender_id_users"),
        sa.ForeignKeyConstraint(
            ["receiver_id"], ["users.user_id"], name="fk_parcels_receiver_id_users"
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"], ["users.user_id"], name="fk_parcels_driver_id_users"
        ),
        sa.CheckConstraint("weight > 0", name="ck_parcels_weight_positive"),
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_parcels_status", "parcels", ["status"])
    op.create_index("ix_parcels_driver_id", "parcels", ["driver_id"])
    op.create_index("ix_parcels_sender_status", "parcels", ["sender_id", "status"])
    op.create_index("ix_parcels_receiver_status", "parcels", ["receiver_id", "status"])
    op.create_index("ix_parcels_driver_status", "parcels", ["driver_id", "status"])
    op.create_index("ix_parcels_created_at", "parcels", ["created_at"])

    op.create_table(
        "tracking_logs",
        sa.Column("log_id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("tracking_number", sa.String(24), nullable=False),
        sa.Column("status", PARCEL_STATUS, nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("remarks", sa.String(500), nullable=True),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(
            ["tracking_number"],
            ["parcels.tracking_number"],
            name="fk_tracking_logs_tracking_number_parcels",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.user_id"], name="fk_tracking_logs_created_by_users"
        ),
        mysql_charset="utf8mb4",
    )
    op.create_index("ix_tracking_logs_tracking_number", "tracking_logs", ["tracking_number"])
    op.create_index(
        "ix_tracking_logs_parcel_time", "tracking_logs", ["tracking_number", "updated_at"]
    )


def downgrade() -> None:
    op.drop_table("tracking_logs")
    op.drop_table("parcels")
    op.drop_table("users")
