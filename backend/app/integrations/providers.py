from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Type

from .base import HeartRateProvider, HeartRateSample


class HealthKitProvider(HeartRateProvider):
    provider_name = "healthkit"

    async def fetch_samples(
        self,
        external_user_id: str,
        start_at: datetime,
        end_at: datetime,
    ) -> List[HeartRateSample]:
        # Placeholder for Apple HealthKit bridge implementation.
        return []


class GoogleFitProvider(HeartRateProvider):
    provider_name = "google_fit"

    async def fetch_samples(
        self,
        external_user_id: str,
        start_at: datetime,
        end_at: datetime,
    ) -> List[HeartRateSample]:
        # Placeholder for Google Fit bridge implementation.
        return []


class FitbitProvider(HeartRateProvider):
    provider_name = "fitbit"

    async def fetch_samples(
        self,
        external_user_id: str,
        start_at: datetime,
        end_at: datetime,
    ) -> List[HeartRateSample]:
        # Placeholder for Fitbit API integration.
        return []


PROVIDER_REGISTRY: Dict[str, Type[HeartRateProvider]] = {
    HealthKitProvider.provider_name: HealthKitProvider,
    GoogleFitProvider.provider_name: GoogleFitProvider,
    FitbitProvider.provider_name: FitbitProvider,
}


def get_provider(provider_name: str) -> HeartRateProvider:
    provider_type = PROVIDER_REGISTRY.get(provider_name.lower())
    if provider_type is None:
        raise ValueError(f"Unsupported HR provider: {provider_name}")
    return provider_type()
