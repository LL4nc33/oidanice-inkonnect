"""Industry Profiles für dolmtschr / OidaNice Health.

Jedes Profil setzt optimale Defaults für eine Branche:
System Prompt, Quick Languages, Retention, Audio/TTS defaults.
"""
from dataclasses import dataclass


@dataclass
class IndustryProfile:
    id: str
    name: str
    icon: str
    system_prompt: str
    quick_languages: list[tuple[str, str]]
    default_retention_days: int
    audio_enabled_default: bool
    tts_enabled_default: bool
    recommended_model: str
    description: str


MEDICAL_PROMPT = (
    "You are a medical interpreter. Translate accurately and formally. "
    "Preserve medical terminology precisely. Never omit, add, or simplify "
    "medical information. Use formal register appropriate for clinical settings. "
    "If a term has no exact equivalent, transliterate and add a brief explanation. "
    "Translate from {source} to {target}. Output ONLY the translation."
)

NGO_PROMPT = (
    "You are an interpreter for social services. Translate clearly using "
    "simple, everyday language. Avoid bureaucratic jargon – use plain words "
    "that someone with basic language skills can understand. Be accurate but "
    "prioritize clarity over formality. Translate from {source} to {target}. "
    "Output ONLY the translation."
)

HOTEL_PROMPT = (
    "You are a hotel concierge interpreter. Translate in a warm, professional, "
    "and service-oriented tone. Use polite forms of address. Keep translations "
    "natural and conversational – not stiff or overly formal. "
    "Translate from {source} to {target}. Output ONLY the translation."
)

GOVERNMENT_PROMPT = (
    "You are an official interpreter for government services. Translate formally "
    "and precisely. Preserve legal and administrative terminology accurately. "
    "Use the formal register. Do not simplify or paraphrase official terms. "
    "Translate from {source} to {target}. Output ONLY the translation."
)

RETAIL_PROMPT = (
    "You are a shop assistant interpreter. Translate in a friendly, helpful tone. "
    "Keep it casual and natural. Use simple language for product descriptions, "
    "prices, and directions. Translate from {source} to {target}. "
    "Output ONLY the translation."
)

EDUCATION_PROMPT = (
    "You are an interpreter for educational settings. Translate clearly and "
    "patiently. Use simple, age-appropriate language. Avoid complex sentence "
    "structures. For parent communication, maintain a respectful and supportive "
    "tone. Translate from {source} to {target}. Output ONLY the translation."
)


_PROFILES: list[IndustryProfile] = [
    IndustryProfile(
        id="medical",
        name="Medizin",
        icon="🏥",
        system_prompt=MEDICAL_PROMPT,
        quick_languages=[
            ("de", "ar"), ("de", "tr"), ("de", "ru"),
            ("de", "uk"), ("de", "fa"),
        ],
        default_retention_days=3650,
        audio_enabled_default=True,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="Arztpraxen, Krankenhäuser, Therapie",
    ),
    IndustryProfile(
        id="ngo",
        name="NGO / Soziales",
        icon="🏠",
        system_prompt=NGO_PROMPT,
        quick_languages=[
            ("de", "ar"), ("de", "tr"), ("de", "fa"),
            ("de", "uk"), ("de", "ru"),
        ],
        default_retention_days=365,
        audio_enabled_default=False,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="Caritas, Diakonie, Flüchtlingsberatung",
    ),
    IndustryProfile(
        id="hotel",
        name="Hotel / Tourismus",
        icon="🏨",
        system_prompt=HOTEL_PROMPT,
        quick_languages=[
            ("de", "en"), ("de", "it"), ("de", "fr"),
            ("de", "es"), ("de", "ja"),
        ],
        default_retention_days=1,
        audio_enabled_default=False,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="Rezeption, Concierge, Restaurant",
    ),
    IndustryProfile(
        id="government",
        name="Behörde",
        icon="🏛️",
        system_prompt=GOVERNMENT_PROMPT,
        quick_languages=[
            ("de", "ar"), ("de", "tr"), ("de", "ru"),
            ("de", "uk"), ("de", "fa"),
        ],
        default_retention_days=2555,
        audio_enabled_default=True,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="MA 35, AMS, Bezirksamt",
    ),
    IndustryProfile(
        id="retail",
        name="Handel",
        icon="🛍️",
        system_prompt=RETAIL_PROMPT,
        quick_languages=[
            ("de", "en"), ("de", "ar"), ("de", "tr"),
            ("de", "zh"), ("de", "ru"),
        ],
        default_retention_days=1,
        audio_enabled_default=False,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="Geschäfte, Boutiquen, Märkte",
    ),
    IndustryProfile(
        id="education",
        name="Bildung",
        icon="🎓",
        system_prompt=EDUCATION_PROMPT,
        quick_languages=[
            ("de", "ar"), ("de", "tr"), ("de", "uk"),
            ("de", "ru"), ("de", "fa"),
        ],
        default_retention_days=30,
        audio_enabled_default=False,
        tts_enabled_default=True,
        recommended_model="gemma3:4b",
        description="Schulen, VHS, Sprachkurse",
    ),
]

_PROFILE_MAP: dict[str, IndustryProfile] = {p.id: p for p in _PROFILES}


def get_all_profiles() -> list[IndustryProfile]:
    return _PROFILES


def get_profile(profile_id: str) -> IndustryProfile | None:
    return _PROFILE_MAP.get(profile_id)


def get_system_prompt(profile_id: str, source: str, target: str) -> str:
    """Gefüllten System-Prompt für ein Profil zurückgeben.

    Fallback auf generischen Prompt wenn Profil nicht gefunden.
    """
    profile = get_profile(profile_id)
    if profile is None:
        return (
            f"You are a professional translator. "
            f"Translate from {source} to {target}. "
            f"Output ONLY the translation, nothing else."
        )
    return profile.system_prompt.format(source=source, target=target)
