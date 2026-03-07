"""Tests für Industry Profiles."""
from backend.profiles import get_all_profiles, get_profile, get_system_prompt


def test_all_profiles_loaded():
    profiles = get_all_profiles()
    assert len(profiles) == 6
    ids = [p.id for p in profiles]
    assert "medical" in ids
    assert "ngo" in ids


def test_get_profile_medical():
    p = get_profile("medical")
    assert p is not None
    assert p.icon == "🏥"
    assert p.default_retention_days == 3650
    assert p.audio_enabled_default is True
    assert len(p.quick_languages) >= 4


def test_get_profile_unknown():
    assert get_profile("nonexistent") is None


def test_system_prompt_medical():
    prompt = get_system_prompt("medical", "de", "ar")
    assert "medical interpreter" in prompt
    assert "de" in prompt
    assert "ar" in prompt
    assert "{source}" not in prompt
    assert "{target}" not in prompt


def test_system_prompt_fallback():
    prompt = get_system_prompt("unknown_profile", "de", "en")
    assert "translator" in prompt
    assert "de" in prompt
    assert "en" in prompt
