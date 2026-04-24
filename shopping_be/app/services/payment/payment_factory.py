"""
Port of PaymentServiceFactory.java.

Holds a dict of {PaymentProviderType → PaymentProvider}.
Falls back to default provider, then first available, if requested type is absent.
"""
from typing import Dict, List, Optional

from app.services.payment.base import PaymentProvider
from app.enums import PaymentProviderType


class PaymentServiceFactory:

    def __init__(
        self,
        providers: List[PaymentProvider],
        default_provider_type: PaymentProviderType,
    ):
        self._provider_map: Dict[PaymentProviderType, PaymentProvider] = {
            p.get_payment_type(): p for p in providers
        }
        self._default_type = default_provider_type

    def get_payment_provider(
        self, provider_type: Optional[PaymentProviderType] = None
    ) -> PaymentProvider:
        target = provider_type if provider_type is not None else self._default_type
        provider = self._provider_map.get(target)
        if provider is not None:
            return provider

        # Fallback to default
        provider = self._provider_map.get(self._default_type)
        if provider is not None:
            return provider

        # Last resort: first registered provider
        if self._provider_map:
            return next(iter(self._provider_map.values()))

        raise RuntimeError(f"No payment provider found for type: {target}")
