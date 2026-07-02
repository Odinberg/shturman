"""drop_unique_constraint_from_subpersonality_posts

Drop the UniqueConstraint(user_id, post_date) on subpersonality_posts,
allowing multiple posts per day per user.

Revision ID: 9d8f7e6c5b4a
Revises: 35a9bc1bf3e4
Create Date: 2026-07-01
"""

from typing import Sequence, Union
from alembic import op

revision: str = '9d8f7e6c5b4a'
down_revision: Union[str, Sequence[str], None] = '35a9bc1bf3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL auto-names table-level unique constraints as:
    #   <tablename>_<col1>_<col2>_key
    op.drop_constraint(
        "subpersonality_posts_user_id_post_date_key",
        "subpersonality_posts",
        type_="unique",
    )


def downgrade() -> None:
    op.create_unique_constraint(
        "subpersonality_posts_user_id_post_date_key",
        "subpersonality_posts",
        ["user_id", "post_date"],
    )
