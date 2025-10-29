"""Shared helpers for plant name normalisation in link scripts."""
from __future__ import annotations

import re

__all__ = [
    "canonical_name_key",
    "latin_binomial_key",
]

_SKIP_TOKENS = {
    "subsp",
    "ssp",
    "var",
    "f",
    "forma",
    "subvar",
    "cv",
    "cultivar",
    "x",
}


def _normalise_hybrid_markers(text: str) -> str:
    return text.replace("×", "x").replace("✕", "x")


def canonical_name_key(text: str) -> str:
    """Return a lowercase key tolerant to casing and hybrid markers."""
    if not text:
        return ""
    text = _normalise_hybrid_markers(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.lower()


def latin_binomial_key(text: str) -> str:
    """Return a normalised "genus species" key for binomial names."""
    if not text:
        return ""
    text = re.sub(r"\([^)]*\)", " ", text)
    text = _normalise_hybrid_markers(text)
    tokens = re.findall(r"[A-Za-z]+", text.lower())
    core = [t for t in tokens if t not in _SKIP_TOKENS]
    return " ".join(core[:2]) if len(core) >= 2 else ""
