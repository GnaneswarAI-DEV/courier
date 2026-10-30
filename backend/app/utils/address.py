"""Address helpers.

Public tracking deliberately shows a coarse location instead of the full street
address, so a tracking number cannot be used to discover where someone lives.
"""

from __future__ import annotations


def city_of(address: str) -> str:
    """Best-effort city extraction from a free-text address.

    ``"12 MG Road, Bengaluru, Karnataka 560001"`` -> ``"Bengaluru"``.
    Addresses without a comma are returned unchanged (trimmed).
    """
    parts = [part.strip() for part in address.split(",") if part.strip()]
    if not parts:
        return "Unknown"
    if len(parts) >= 2:
        # Convention: "street, city[, state/postcode]" -> the city is second.
        return parts[1]
    return parts[0]
