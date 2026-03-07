from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass(slots=True)
class HeartRateSample:
    measured_at: datetime
    heart_rate: int
    source: str


class HeartRateProvider(ABC):
    provider_name: str

    @abstractmethod
    async def fetch_samples(
        self,
        external_user_id: str,
        start_at: datetime,
        end_at: datetime,
    ) -> List[HeartRateSample]:
        """
        Fetch heart-rate samples for a user and time range.
        """
