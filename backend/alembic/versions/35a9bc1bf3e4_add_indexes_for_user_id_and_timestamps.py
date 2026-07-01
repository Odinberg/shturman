"""add_indexes_for_user_id_and_timestamps

Revision ID: 35a9bc1bf3e4
Revises: f7b3e9525c32
Create Date: 2026-07-01
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '35a9bc1bf3e4'
down_revision: Union[str, Sequence[str], None] = 'f7b3e9525c32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Direction 1: Journal ---
    op.create_index("ix_journal_entries_user_id", "journal_entries", ["user_id"])
    op.create_index("ix_journal_entries_created_at", "journal_entries", ["created_at"])

    op.create_index("ix_pattern_maps_user_id", "pattern_maps", ["user_id"])
    op.create_index("ix_pattern_maps_created_at", "pattern_maps", ["created_at"])

    op.create_index("ix_alt_reality_sessions_user_id", "alt_reality_sessions", ["user_id"])
    op.create_index("ix_alt_reality_sessions_created_at", "alt_reality_sessions", ["created_at"])

    # --- Direction 2: Emotional ---
    op.create_index("ix_emotional_checkins_user_id", "emotional_checkins", ["user_id"])
    op.create_index("ix_emotional_checkins_checkin_time", "emotional_checkins", ["checkin_time"])

    op.create_index("ix_biorhythm_reports_user_id", "biorhythm_reports", ["user_id"])
    op.create_index("ix_biorhythm_reports_created_at", "biorhythm_reports", ["created_at"])

    op.create_index("ix_resource_collections_user_id", "resource_collections", ["user_id"])
    op.create_index("ix_resource_collections_created_at", "resource_collections", ["created_at"])

    op.create_index("ix_emotional_avatars_user_id", "emotional_avatars", ["user_id"])
    op.create_index("ix_emotional_avatars_created_at", "emotional_avatars", ["created_at"])

    # --- Direction 3: Reframing ---
    op.create_index("ix_reframing_sessions_user_id", "reframing_sessions", ["user_id"])
    op.create_index("ix_reframing_sessions_created_at", "reframing_sessions", ["created_at"])

    op.create_index("ix_insight_boxes_user_id", "insight_boxes", ["user_id"])
    op.create_index("ix_insight_boxes_created_at", "insight_boxes", ["created_at"])

    op.create_index("ix_blind_spot_sessions_user_id", "blind_spot_sessions", ["user_id"])
    op.create_index("ix_blind_spot_sessions_created_at", "blind_spot_sessions", ["created_at"])

    # --- Direction 4: Shadow ---
    op.create_index("ix_shadow_recordings_user_id", "shadow_recordings", ["user_id"])
    op.create_index("ix_shadow_recordings_created_at", "shadow_recordings", ["created_at"])

    op.create_index("ix_mirror_letters_user_id", "mirror_letters", ["user_id"])
    op.create_index("ix_mirror_letters_created_at", "mirror_letters", ["created_at"])

    op.create_index("ix_forbidden_desires_user_id", "forbidden_desires", ["user_id"])
    op.create_index("ix_forbidden_desires_created_at", "forbidden_desires", ["created_at"])

    op.create_index("ix_anti_hero_comics_user_id", "anti_hero_comics", ["user_id"])
    op.create_index("ix_anti_hero_comics_created_at", "anti_hero_comics", ["created_at"])

    # --- Direction 5: Sensory ---
    op.create_index("ix_sensory_checkins_user_id", "sensory_checkins", ["user_id"])
    op.create_index("ix_sensory_checkins_checkin_time", "sensory_checkins", ["checkin_time"])

    op.create_index("ix_sensory_predictions_user_id", "sensory_predictions", ["user_id"])
    op.create_index("ix_sensory_predictions_created_at", "sensory_predictions", ["created_at"])

    op.create_index("ix_calm_anchors_user_id", "calm_anchors", ["user_id"])
    op.create_index("ix_calm_anchors_created_at", "calm_anchors", ["created_at"])

    # --- Direction 6: Multiplicity ---
    op.create_index("ix_subpersonality_posts_user_id", "subpersonality_posts", ["user_id"])

    op.create_index("ix_round_table_sessions_user_id", "round_table_sessions", ["user_id"])
    op.create_index("ix_round_table_sessions_created_at", "round_table_sessions", ["created_at"])

    op.create_index("ix_family_portraits_user_id", "family_portraits", ["user_id"])
    op.create_index("ix_family_portraits_created_at", "family_portraits", ["created_at"])

    op.create_index("ix_negotiator_sessions_user_id", "negotiator_sessions", ["user_id"])
    op.create_index("ix_negotiator_sessions_created_at", "negotiator_sessions", ["created_at"])

    # --- Direction 7: Butterfly ---
    op.create_index("ix_butterfly_events_user_id", "butterfly_events", ["user_id"])
    op.create_index("ix_butterfly_events_event_date", "butterfly_events", ["event_date"])

    op.create_index("ix_fractal_cards_user_id", "fractal_cards", ["user_id"])
    op.create_index("ix_fractal_cards_created_at", "fractal_cards", ["created_at"])

    op.create_index("ix_wonder_vaults_user_id", "wonder_vaults", ["user_id"])
    op.create_index("ix_wonder_vaults_created_at", "wonder_vaults", ["created_at"])

    # --- Archimedes Lever ---
    op.create_index("ix_chronicle_slots_user_id", "chronicle_slots", ["user_id"])
    op.create_index("ix_chronicle_slots_slot_date", "chronicle_slots", ["slot_date"])
    op.create_index("ix_chronicle_slots_created_at", "chronicle_slots", ["created_at"])


def downgrade() -> None:
    # --- Direction 1: Journal ---
    op.drop_index("ix_journal_entries_user_id", table_name="journal_entries")
    op.drop_index("ix_journal_entries_created_at", table_name="journal_entries")

    op.drop_index("ix_pattern_maps_user_id", table_name="pattern_maps")
    op.drop_index("ix_pattern_maps_created_at", table_name="pattern_maps")

    op.drop_index("ix_alt_reality_sessions_user_id", table_name="alt_reality_sessions")
    op.drop_index("ix_alt_reality_sessions_created_at", table_name="alt_reality_sessions")

    # --- Direction 2: Emotional ---
    op.drop_index("ix_emotional_checkins_user_id", table_name="emotional_checkins")
    op.drop_index("ix_emotional_checkins_checkin_time", table_name="emotional_checkins")

    op.drop_index("ix_biorhythm_reports_user_id", table_name="biorhythm_reports")
    op.drop_index("ix_biorhythm_reports_created_at", table_name="biorhythm_reports")

    op.drop_index("ix_resource_collections_user_id", table_name="resource_collections")
    op.drop_index("ix_resource_collections_created_at", table_name="resource_collections")

    op.drop_index("ix_emotional_avatars_user_id", table_name="emotional_avatars")
    op.drop_index("ix_emotional_avatars_created_at", table_name="emotional_avatars")

    # --- Direction 3: Reframing ---
    op.drop_index("ix_reframing_sessions_user_id", table_name="reframing_sessions")
    op.drop_index("ix_reframing_sessions_created_at", table_name="reframing_sessions")

    op.drop_index("ix_insight_boxes_user_id", table_name="insight_boxes")
    op.drop_index("ix_insight_boxes_created_at", table_name="insight_boxes")

    op.drop_index("ix_blind_spot_sessions_user_id", table_name="blind_spot_sessions")
    op.drop_index("ix_blind_spot_sessions_created_at", table_name="blind_spot_sessions")

    # --- Direction 4: Shadow ---
    op.drop_index("ix_shadow_recordings_user_id", table_name="shadow_recordings")
    op.drop_index("ix_shadow_recordings_created_at", table_name="shadow_recordings")

    op.drop_index("ix_mirror_letters_user_id", table_name="mirror_letters")
    op.drop_index("ix_mirror_letters_created_at", table_name="mirror_letters")

    op.drop_index("ix_forbidden_desires_user_id", table_name="forbidden_desires")
    op.drop_index("ix_forbidden_desires_created_at", table_name="forbidden_desires")

    op.drop_index("ix_anti_hero_comics_user_id", table_name="anti_hero_comics")
    op.drop_index("ix_anti_hero_comics_created_at", table_name="anti_hero_comics")

    # --- Direction 5: Sensory ---
    op.drop_index("ix_sensory_checkins_user_id", table_name="sensory_checkins")
    op.drop_index("ix_sensory_checkins_checkin_time", table_name="sensory_checkins")

    op.drop_index("ix_sensory_predictions_user_id", table_name="sensory_predictions")
    op.drop_index("ix_sensory_predictions_created_at", table_name="sensory_predictions")

    op.drop_index("ix_calm_anchors_user_id", table_name="calm_anchors")
    op.drop_index("ix_calm_anchors_created_at", table_name="calm_anchors")

    # --- Direction 6: Multiplicity ---
    op.drop_index("ix_subpersonality_posts_user_id", table_name="subpersonality_posts")

    op.drop_index("ix_round_table_sessions_user_id", table_name="round_table_sessions")
    op.drop_index("ix_round_table_sessions_created_at", table_name="round_table_sessions")

    op.drop_index("ix_family_portraits_user_id", table_name="family_portraits")
    op.drop_index("ix_family_portraits_created_at", table_name="family_portraits")

    op.drop_index("ix_negotiator_sessions_user_id", table_name="negotiator_sessions")
    op.drop_index("ix_negotiator_sessions_created_at", table_name="negotiator_sessions")

    # --- Direction 7: Butterfly ---
    op.drop_index("ix_butterfly_events_user_id", table_name="butterfly_events")
    op.drop_index("ix_butterfly_events_event_date", table_name="butterfly_events")

    op.drop_index("ix_fractal_cards_user_id", table_name="fractal_cards")
    op.drop_index("ix_fractal_cards_created_at", table_name="fractal_cards")

    op.drop_index("ix_wonder_vaults_user_id", table_name="wonder_vaults")
    op.drop_index("ix_wonder_vaults_created_at", table_name="wonder_vaults")

    # --- Archimedes Lever ---
    op.drop_index("ix_chronicle_slots_user_id", table_name="chronicle_slots")
    op.drop_index("ix_chronicle_slots_slot_date", table_name="chronicle_slots")
    op.drop_index("ix_chronicle_slots_created_at", table_name="chronicle_slots")
