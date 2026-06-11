"""Xbox Live presence aggregator — Python sample."""
from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import StrEnum
from typing import Iterable, Self

import httpx


class Presence(StrEnum):
    ONLINE = "online"
    AWAY = "away"
    OFFLINE = "offline"


@dataclass(frozen=True, slots=True)
class Player:
    gamertag: str
    gamerscore: int
    presence: Presence
    last_seen: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    @classmethod
    def from_api(cls, payload: dict) -> Self:
        return cls(
            gamertag=payload["gamertag"],
            gamerscore=int(payload.get("gamerscore", 0)),
            presence=Presence(payload["presence"]),
            last_seen=datetime.fromisoformat(payload["lastSeen"]),
        )

    @property
    def is_active(self) -> bool:
        return self.presence is not Presence.OFFLINE


async def fetch_presence(client: httpx.AsyncClient, gamertag: str) -> Player:
    response = await client.get(f"/players/{gamertag}", timeout=5.0)
    response.raise_for_status()
    return Player.from_api(response.json())


async def aggregate(gamertags: Iterable[str]) -> list[Player]:
    """Fetch presence for many gamertags concurrently."""
    async with httpx.AsyncClient(base_url="https://api.xbox.com/v3") as client:
        tasks = [fetch_presence(client, tag) for tag in gamertags]
        return await asyncio.gather(*tasks)


def summarize(players: list[Player]) -> str:
    online = sum(1 for p in players if p.is_active)
    total_score = sum(p.gamerscore for p in players)
    return f"{online}/{len(players)} online — {total_score:,}G combined"


if __name__ == "__main__":
    roster = ["MajorNelson", "larryhryb", "phil_spencer"]
    players = asyncio.run(aggregate(roster))
    print(summarize(players))
    for p in sorted(players, key=lambda p: -p.gamerscore):
        print(f"  {p.gamertag:20s} {p.presence.value:8s} {p.gamerscore:>8,}G")
