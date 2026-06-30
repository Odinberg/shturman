"""create_all_tables

Revision ID: f7b3e9525c32
Revises: 
Create Date: 2026-06-30
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'f7b3e9525c32'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users ---
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('uuid', sa.String(36), nullable=False, unique=True),
        sa.Column('telegram_id', sa.String(64), unique=True),
        sa.Column('vk_user_id', sa.String(64), unique=True),
        sa.Column('username', sa.String(128), nullable=False),
        sa.Column('email', sa.String(255), unique=True),
        sa.Column('hashed_password', sa.String(255)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D1: Journal ---
    op.create_table(
        'journal_entries',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('mood', sa.String(64)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'pattern_maps',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('patterns_json', postgresql.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'alt_reality_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('journal_entry_id', sa.Integer(), sa.ForeignKey('journal_entries.id'), nullable=False),
        sa.Column('genre', sa.String(32), nullable=False),
        sa.Column('original_text', sa.Text(), nullable=False),
        sa.Column('rewritten_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D2: Emotional ---
    op.create_table(
        'emotional_checkins',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('emoji', sa.String(16), nullable=False),
        sa.Column('event_words', sa.String(256), nullable=False),
        sa.Column('checkin_time', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'biorhythm_reports',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('period_days', sa.Integer(), nullable=False),
        sa.Column('report_text', sa.Text(), nullable=False),
        sa.Column('peak_time', sa.String(64)),
        sa.Column('slump_time', sa.String(64)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'resource_collections',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('month', sa.String(7), nullable=False),
        sa.Column('resources_json', postgresql.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'emotional_avatars',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('week_start', sa.Date(), nullable=False),
        sa.Column('avatar_text', sa.Text(), nullable=False),
        sa.Column('dalle_prompt', sa.Text(), nullable=False),
        sa.Column('previous_avatar', sa.String(256)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'week_start'),
    )

    # --- D3: Reframing ---
    op.create_table(
        'reframing_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('situation_text', sa.Text(), nullable=False),
        sa.Column('perspectives_json', postgresql.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'insight_boxes',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('session_ids', postgresql.JSON(), nullable=False),
        sa.Column('box_content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'blind_spot_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('user_query', sa.Text(), nullable=False),
        sa.Column('question_1', sa.String(512), nullable=False),
        sa.Column('question_2', sa.String(512), nullable=False),
        sa.Column('user_response', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D4: Shadow ---
    op.create_table(
        'shadow_recordings',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('transcript', sa.Text(), nullable=False),
        sa.Column('irritation_target', sa.String(256), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'mirror_letters',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('recording_id', sa.Integer(), sa.ForeignKey('shadow_recordings.id'), nullable=False),
        sa.Column('trait_name', sa.String(128), nullable=False),
        sa.Column('letter_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'forbidden_desires',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('recording_ids', postgresql.JSON(), nullable=False),
        sa.Column('desire_text', sa.Text(), nullable=False),
        sa.Column('protection_text', sa.Text(), nullable=False),
        sa.Column('hypnosis_script', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'anti_hero_comics',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('shadow_trait', sa.String(128), nullable=False),
        sa.Column('script_json', postgresql.JSON(), nullable=False),
        sa.Column('dalle_prompt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D5: Sensory ---
    op.create_table(
        'sensory_checkins',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('sensation', sa.String(32), nullable=False),
        sa.Column('checkin_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('accelerometer_json', postgresql.JSON()),
        sa.Column('location_context', sa.String(64)),
    )

    op.create_table(
        'sensory_predictions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('predicted_state', sa.String(128), nullable=False),
        sa.Column('prediction_horizon', sa.Integer()),
        sa.Column('confidence', sa.Float()),
        sa.Column('sent_push', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'calm_anchors',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('journal_entry_id', sa.Integer(), sa.ForeignKey('journal_entries.id')),
        sa.Column('vibration_pattern', postgresql.JSON(), nullable=False),
        sa.Column('breathing_rhythm', sa.String(32)),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D6: Multiplicity ---
    op.create_table(
        'subpersonality_posts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('subpersonality', sa.String(128), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('post_date', sa.Date(), nullable=False),
        sa.UniqueConstraint('user_id', 'post_date'),
    )

    op.create_table(
        'round_table_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('participants_json', postgresql.JSON(), nullable=False),
        sa.Column('dialogue_json', postgresql.JSON(), nullable=False),
        sa.Column('moderator_note', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'family_portraits',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('characters_json', postgresql.JSON(), nullable=False),
        sa.Column('portrait_text', sa.Text(), nullable=False),
        sa.Column('dalle_prompt', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'negotiator_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('critic_quote', sa.Text(), nullable=False),
        sa.Column('dialogue_json', postgresql.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- D7: Butterfly ---
    op.create_table(
        'butterfly_events',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_text', sa.String(512), nullable=False),
        sa.Column('event_date', sa.Date(), nullable=False),
    )

    op.create_table(
        'fractal_cards',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('butterfly_events.id'), nullable=False),
        sa.Column('association_chain', postgresql.JSON(), nullable=False),
        sa.Column('insight_text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        'wonder_vaults',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('month', sa.String(7), nullable=False),
        sa.Column('slideshow_text', sa.Text(), nullable=False),
        sa.Column('parable_text', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # --- Archimedean Lever ---
    op.create_table(
        'chronicle_slots',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('slot_date', sa.Date(), nullable=False),
        sa.Column('layers_json', postgresql.JSON(), nullable=False),
        sa.Column('artifact_text', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'slot_date'),
    )


def downgrade() -> None:
    op.drop_table('chronicle_slots')
    op.drop_table('wonder_vaults')
    op.drop_table('fractal_cards')
    op.drop_table('butterfly_events')
    op.drop_table('negotiator_sessions')
    op.drop_table('family_portraits')
    op.drop_table('round_table_sessions')
    op.drop_table('subpersonality_posts')
    op.drop_table('calm_anchors')
    op.drop_table('sensory_predictions')
    op.drop_table('sensory_checkins')
    op.drop_table('anti_hero_comics')
    op.drop_table('forbidden_desires')
    op.drop_table('mirror_letters')
    op.drop_table('shadow_recordings')
    op.drop_table('blind_spot_sessions')
    op.drop_table('insight_boxes')
    op.drop_table('reframing_sessions')
    op.drop_table('emotional_avatars')
    op.drop_table('resource_collections')
    op.drop_table('biorhythm_reports')
    op.drop_table('emotional_checkins')
    op.drop_table('alt_reality_sessions')
    op.drop_table('pattern_maps')
    op.drop_table('journal_entries')
    op.drop_table('users')
