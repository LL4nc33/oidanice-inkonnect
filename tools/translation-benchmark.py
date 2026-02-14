"""
Dolmtschr Translation Model Benchmark
======================================
Vergleicht Uebersetzungsqualitaet von LLMs via Ollama API.
Testet: Gemma 3:4b, Ministral 3:8b, Qwen 2.5:7b

Voraussetzung: Ollama laeuft + alle drei Modelle gepullt:
  ollama pull gemma3:4b
  ollama pull ministral-3:8b
  ollama pull qwen2.5:7b

Usage: python translation-benchmark.py [--ollama-url http://localhost:11434]
       python translation-benchmark.py --models gemma3:4b qwen2.5:7b
"""

import argparse
import json
import time
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError
from datetime import datetime


# ============================================================
# CONFIG
# ============================================================

MODELS = [
    "gemma3:4b",
    "ministral-3:8b",
    "qwen2.5:7b",
]

# Testsaetze mit Referenz-Uebersetzung (nur zum manuellen Vergleichen)
TEST_SENTENCES = [
    # --- Deutsch -> Englisch (Baseline) ---
    {
        "text": "Der Patient klagt über starke Kopfschmerzen und Schwindel seit drei Tagen.",
        "source": "de",
        "target": "en",
        "reference": "The patient complains of severe headaches and dizziness for three days.",
        "category": "Medizin DE->EN",
    },
    {
        "text": "Ihr Aufenthalt wurde um zwei Nächte verlängert. Sollen wir den Flughafentransfer neu buchen?",
        "source": "de",
        "target": "en",
        "reference": "Your stay has been extended by two nights. Should we rebook the airport transfer?",
        "category": "Hotel DE->EN",
    },

    # --- Englisch -> Deutsch ---
    {
        "text": "I need to apply for a residence permit. Where can I find the registration office?",
        "source": "en",
        "target": "de",
        "reference": "Ich muss eine Aufenthaltsgenehmigung beantragen. Wo finde ich das Meldeamt?",
        "category": "Behoerde EN->DE",
    },

    # --- Deutsch -> Arabisch (kritisch fuer NGO-Usecase) ---
    {
        "text": "Ihr Asylantrag wird derzeit geprüft. Bitte bringen Sie alle Dokumente zum nächsten Termin mit.",
        "source": "de",
        "target": "ar",
        "reference": "طلب اللجوء الخاص بك قيد المراجعة حالياً. يرجى إحضار جميع المستندات إلى الموعد القادم.",
        "category": "Asyl DE->AR",
    },
    {
        "text": "Nehmen Sie die Tabletten dreimal täglich nach dem Essen ein.",
        "source": "de",
        "target": "ar",
        "reference": "تناول الأقراص ثلاث مرات يومياً بعد الأكل.",
        "category": "Medizin DE->AR",
    },

    # --- Arabisch -> Deutsch (kritisch) ---
    {
        "text": "أعاني من ألم شديد في الصدر وصعوبة في التنفس.",
        "source": "ar",
        "target": "de",
        "reference": "Ich leide unter starken Brustschmerzen und Atemnot.",
        "category": "Medizin AR->DE",
    },

    # --- Deutsch -> Tuerkisch ---
    {
        "text": "Sie haben Anspruch auf Grundversorgung. Bitte melden Sie sich bei der zuständigen Stelle.",
        "source": "de",
        "target": "tr",
        "reference": "Temel bakım hakkınız bulunmaktadır. Lütfen yetkili makama başvurunuz.",
        "category": "Behoerde DE->TR",
    },

    # --- Tuerkisch -> Deutsch ---
    {
        "text": "Çocuğumun ateşi çok yüksek ve sürekli kusuyor.",
        "source": "tr",
        "target": "de",
        "reference": "Mein Kind hat sehr hohes Fieber und erbricht sich ständig.",
        "category": "Medizin TR->DE",
    },

    # --- Deutsch -> Russisch ---
    {
        "text": "Die Beratungsstelle ist montags bis freitags von 9 bis 14 Uhr geöffnet.",
        "source": "de",
        "target": "ru",
        "reference": "Консультационный центр открыт с понедельника по пятницу с 9 до 14 часов.",
        "category": "Behoerde DE->RU",
    },

    # --- Russisch -> Deutsch ---
    {
        "text": "Мне нужна справка от врача для работодателя.",
        "source": "ru",
        "target": "de",
        "reference": "Ich brauche ein ärztliches Attest für meinen Arbeitgeber.",
        "category": "Behoerde RU->DE",
    },

    # --- Deutsch -> Farsi/Dari (besonders kritisch) ---
    {
        "text": "Ihr nächster Gerichtstermin ist am fünfzehnten März um zehn Uhr.",
        "source": "de",
        "target": "fa",
        "reference": "وقت دادگاه بعدی شما پانزدهم مارس ساعت ده است.",
        "category": "Recht DE->FA",
    },

    # --- Farsi -> Deutsch ---
    {
        "text": "من سه ماه است که در اتریش هستم و هنوز جواب پناهندگی نگرفتم.",
        "source": "fa",
        "target": "de",
        "reference": "Ich bin seit drei Monaten in Österreich und habe noch keine Antwort auf meinen Asylantrag erhalten.",
        "category": "Asyl FA->DE",
    },
]

SYSTEM_PROMPT = (
    "You are a professional translator. "
    "Translate the following text from {source} to {target}. "
    "Output ONLY the translation, nothing else. "
    "No explanations, no notes, no alternatives."
)

LANG_NAMES = {
    "de": "German",
    "en": "English",
    "ar": "Arabic",
    "tr": "Turkish",
    "ru": "Russian",
    "fa": "Farsi",
}


# ============================================================
# OLLAMA API
# ============================================================

def ollama_translate(ollama_url, model, text, source, target):
    """Send translation request to Ollama. Returns (translation, duration_seconds)."""
    
    system = SYSTEM_PROMPT.format(
        source=LANG_NAMES.get(source, source),
        target=LANG_NAMES.get(target, target),
    )
    
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": text},
        ],
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 512,
        },
    }).encode()

    req = Request(
        f"{ollama_url}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    start = time.perf_counter()
    try:
        with urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except URLError as e:
        return f"[ERROR: {e}]", 0.0
    except Exception as e:
        return f"[ERROR: {e}]", 0.0

    duration = time.perf_counter() - start
    translation = data.get("message", {}).get("content", "[NO RESPONSE]").strip()
    return translation, duration


def check_model_available(ollama_url, model):
    """Check if model is pulled in Ollama."""
    try:
        req = Request(f"{ollama_url}/api/tags", method="GET")
        with urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        available = [m["name"] for m in data.get("models", [])]
        return model in available or f"{model}:latest" in available
    except Exception:
        return False


# ============================================================
# OUTPUT
# ============================================================

SEPARATOR = "=" * 100
SUBSEP = "-" * 100


def print_header():
    print(f"\n{SEPARATOR}")
    print(f"  Dolmtschr Translation Benchmark")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Models: {', '.join(MODELS)}")
    print(f"  Test sentences: {len(TEST_SENTENCES)}")
    print(SEPARATOR)


def print_test_result(idx, test, results):
    print(f"\n{SUBSEP}")
    print(f"  [{idx+1}/{len(TEST_SENTENCES)}] {test['category']}")
    print(f"  {LANG_NAMES[test['source']]} -> {LANG_NAMES[test['target']]}")
    print(SUBSEP)
    print(f"  INPUT:     {test['text']}")
    print(f"  REFERENCE: {test['reference']}")
    print()
    
    for model in MODELS:
        translation, duration = results[model]
        model_short = model.split(":")[0].upper()
        print(f"  {model_short:12s} ({duration:5.1f}s): {translation}")
    print()


def print_summary(all_durations):
    print(f"\n{SEPARATOR}")
    print(f"  SPEED SUMMARY")
    print(SEPARATOR)
    
    for model in MODELS:
        durations = all_durations[model]
        avg = sum(durations) / len(durations) if durations else 0
        total = sum(durations)
        model_short = model.split(":")[0].upper()
        print(f"  {model_short:12s}: avg {avg:5.1f}s | total {total:5.1f}s")
    
    print(f"\n  Qualitaet manuell bewerten:")
    print(f"  - Ist die Uebersetzung korrekt und vollstaendig?")
    print(f"  - Sind Fachbegriffe richtig uebersetzt?")
    print(f"  - Gibt es Halluzinationen (erfundene Inhalte)?")
    print(f"  - Ist nur die Uebersetzung ausgegeben, ohne Extras?")
    print(SEPARATOR)


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Dolmtschr Translation Benchmark")
    parser.add_argument("--ollama-url", default="http://localhost:11434", help="Ollama API URL")
    parser.add_argument("--models", nargs="+", default=None, help="Override models to test")
    args = parser.parse_args()

    global MODELS
    if args.models:
        MODELS = args.models

    # Check Ollama connectivity
    print(f"\nConnecting to Ollama at {args.ollama_url}...")
    try:
        req = Request(f"{args.ollama_url}/api/tags", method="GET")
        with urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
        available = [m["name"] for m in data.get("models", [])]
        print(f"  Connected. {len(available)} models available.")
    except Exception as e:
        print(f"  ERROR: Cannot connect to Ollama at {args.ollama_url}: {e}")
        print(f"  Make sure Ollama is running!")
        sys.exit(1)

    # Check models
    missing = []
    for model in MODELS:
        if not check_model_available(args.ollama_url, model):
            missing.append(model)
    
    if missing:
        print(f"\n  Missing models: {', '.join(missing)}")
        print(f"  Pull them first:")
        for m in missing:
            print(f"    ollama pull {m}")
        
        MODELS = [m for m in MODELS if m not in missing]
        if not MODELS:
            print(f"\n  No models available. Exiting.")
            sys.exit(1)
        print(f"\n  Continuing with: {', '.join(MODELS)}")

    print_header()

    all_durations = {m: [] for m in MODELS}

    for idx, test in enumerate(TEST_SENTENCES):
        results = {}

        for model in MODELS:
            sys.stdout.write(f"\r  Testing [{idx+1}/{len(TEST_SENTENCES)}] {test['category']} with {model}...")
            sys.stdout.flush()

            translation, duration = ollama_translate(
                args.ollama_url, model, test["text"], test["source"], test["target"]
            )
            results[model] = (translation, duration)
            all_durations[model].append(duration)

        sys.stdout.write("\r" + " " * 80 + "\r")
        print_test_result(idx, test, results)

    print_summary(all_durations)

    # Save raw results as JSON
    output = {
        "timestamp": datetime.now().isoformat(),
        "models": MODELS,
        "results": [],
    }
    for idx, test in enumerate(TEST_SENTENCES):
        entry = {**test}
        output["results"].append(entry)
    
    with open("benchmark-results.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n  Config saved to benchmark-results.json")


if __name__ == "__main__":
    main()
