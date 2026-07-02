"""
Session utilities — token hashing.
"""

import hashlib


def hash_token(token: str) -> str:
    """SHA-256 хеш токена. В БД храним только хеш, не сам токен."""
    return hashlib.sha256(token.encode()).hexdigest()
