"""Settings from the repo's .env.local, and writes to a Supabase table with the secret key."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[3]
UPSERT_BATCH = 500


def load_env() -> dict[str, str]:
    env = {}
    env_file = ROOT / ".env.local"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            key, sep, value = line.partition("=")
            if sep and not key.strip().startswith("#"):
                env[key.strip()] = value.strip().strip("\"'")
    env.update(os.environ)
    return env


class Table:
    def __init__(self, env: dict[str, str], name: str):
        url, key = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get("SUPABASE_SECRET_KEY")
        if not url or not key:
            sys.exit("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY")
        self.endpoint = f"{url.rstrip('/')}/rest/v1/{name}"
        self.headers = {"apikey": key, "Content-Type": "application/json"}
        if key.startswith("eyJ"):  # legacy service_role JWT
            self.headers["Authorization"] = f"Bearer {key}"

    def upsert(self, rows: list[dict], on_conflict: str) -> None:
        for start in range(0, len(rows), UPSERT_BATCH):
            response = requests.post(
                self.endpoint,
                params={"on_conflict": on_conflict},
                headers={**self.headers, "Prefer": "resolution=merge-duplicates,return=minimal"},
                json=rows[start : start + UPSERT_BATCH],
                timeout=60,
            )
            if not response.ok:
                sys.exit(f"Upsert failed: HTTP {response.status_code} {response.text}")

    def count(self, filters: dict[str, str]) -> int:
        response = requests.head(
            self.endpoint,
            params={**filters, "select": "*"},
            headers={**self.headers, "Prefer": "count=exact"},
            timeout=60,
        )
        if not response.ok:
            sys.exit(f"Count failed: HTTP {response.status_code}")
        return int(response.headers["Content-Range"].rsplit("/", 1)[1])

    def delete(self, filters: dict[str, str]) -> None:
        response = requests.delete(self.endpoint, params=filters, headers=self.headers, timeout=60)
        if not response.ok:
            sys.exit(f"Delete failed: HTTP {response.status_code} {response.text}")
