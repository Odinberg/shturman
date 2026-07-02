"""add_refresh_sessions_table

Создаёт таблицу refresh_sessions для хранения refresh-токенов.

Revision ID: ab1c2d3e4f5a
Revises: 9d8f7e6c5b4a
Create Date: 2026-07-01
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'ab1c2d3e4f5a'
down_revision: Union[str, Sequence[str], None] = '9d8f7e6c5b4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'refresh_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('refresh_token_hash', sa.String(64), nullable=False),
        sa.Column('session_uuid', sa.String(36), nullable=True),
        sa.Column('user_agent', sa.String(512), nullable=True),
        sa.Column('ip', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.create_index('ix_refresh_sessions_user_id', 'refresh_sessions', ['user_id'])
    op.create_index('ix_refresh_sessions_token_hash', 'refresh_sessions', ['refresh_token_hash'])


def downgrade() -> None:
    op.drop_index('ix_refresh_sessions_token_hash', table_name='refresh_sessions')
    op.drop_index('ix_refresh_sessions_user_id', table_name='refresh_sessions')
    op.drop_table('refresh_sessions')
