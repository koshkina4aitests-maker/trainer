from __future__ import annotations

from typing import Any, Dict

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token


def verify_google_id_token(id_token: str, expected_client_id: str) -> Dict[str, Any]:
    payload = google_id_token.verify_oauth2_token(
        id_token,
        google_requests.Request(),
        expected_client_id,
    )
    issuer = payload.get("iss")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValueError("Invalid issuer")
    return payload
