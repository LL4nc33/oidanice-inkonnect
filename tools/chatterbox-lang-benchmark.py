#!/usr/bin/env python3
"""
InKonnect Translation Benchmark - Chatterbox Multilingual Edition
Tests all 23 Chatterbox-supported languages across 4 LLM candidates.

Usage:
    python bench.py
    python bench.py --ollama-url http://localhost:11434
    python bench.py --models qwen3:4b gemma3:4b
    python bench.py --quick          # 1 sentence per language
    python bench.py --langs en ar tr  # only specific languages
"""

import argparse, json, sys, time, urllib.request, urllib.error
from datetime import datetime

DEFAULT_MODELS = ["qwen3:4b", "gemma3:4b", "ministral-3:3b", "llama3.2:3b"]

def build_prompt(model, text, source_lang, target_lang):
    names = {
        "ar": "Arabic", "da": "Danish", "de": "German", "el": "Greek",
        "en": "English", "es": "Spanish", "fi": "Finnish", "fr": "French",
        "he": "Hebrew", "hi": "Hindi", "it": "Italian", "ja": "Japanese",
        "ko": "Korean", "ms": "Malay", "nl": "Dutch", "no": "Norwegian",
        "pl": "Polish", "pt": "Portuguese", "ru": "Russian", "sv": "Swedish",
        "sw": "Swahili", "tr": "Turkish", "zh": "Chinese",
    }
    tname = names.get(target_lang, target_lang)
    sname = names.get(source_lang, source_lang)
    base = f"Translate the following {sname} text into {tname}. Output ONLY the translation, nothing else:\n\n{text}"
    if model.startswith("qwen3"):
        return f"/no_think\n{base}"
    return base

# ── Test data: all 23 Chatterbox languages ────────────────────────────
TESTS = {
    "en": {
        "name": "English",
        "pairs": [
            ("Ich habe meinen Aufenthaltstitel verloren und brauche dringend einen neuen.",
             "de", "en", "I lost my residence permit and urgently need a new one.", "formal"),
            ("Mir geht's echt dreckig, ich brauch schnell einen Arzt.",
             "de", "en", "I'm feeling really awful, I need a doctor quickly.", "colloquial"),
            ("My stomach has been hurting for three days and I can't eat anything.",
             "en", "de", "Mein Bauch tut seit drei Tagen weh und ich kann nichts essen.", "formal"),
        ]
    },
    "ar": {
        "name": "Arabic",
        "pairs": [
            ("Ich habe starke Schmerzen in der Brust und brauche einen Arzt.",
             "de", "ar", "أعاني من ألم شديد في صدري وأحتاج إلى طبيب.", "formal"),
            ("Mir geht's echt schlecht, ich brauch dringend Hilfe.",
             "de", "ar", "أنا بحالة سيئة جداً، أحتاج مساعدة عاجلة.", "colloquial"),
        ]
    },
    "tr": {
        "name": "Turkish",
        "pairs": [
            ("Mein Kind hat Fieber und kann seit zwei Tagen nichts essen.",
             "de", "tr", "Çocuğumun ateşi var ve iki gündür hiçbir şey yiyemiyor.", "formal"),
            ("Wo muss ich hin für den Asylantrag?",
             "de", "tr", "İltica başvurusu için nereye gitmem gerekiyor?", "colloquial"),
        ]
    },
    "ru": {
        "name": "Russian",
        "pairs": [
            ("Ich brauche einen Dolmetscher für meinen Termin bei der Behörde.",
             "de", "ru", "Мне нужен переводчик для моей встречи в ведомстве.", "formal"),
            ("Kannst du mir helfen? Ich versteh die Formulare nicht.",
             "de", "ru", "Можешь мне помочь? Я не понимаю формуляры.", "colloquial"),
        ]
    },
    "fr": {
        "name": "French",
        "pairs": [
            ("Ich benötige eine Bescheinigung für meinen Arbeitgeber.",
             "de", "fr", "J'ai besoin d'une attestation pour mon employeur.", "formal"),
            ("Ich hab keinen Plan wie das funktioniert.",
             "de", "fr", "Je comprends pas du tout comment ça marche.", "colloquial"),
        ]
    },
    "es": {
        "name": "Spanish",
        "pairs": [
            ("Mein Kind hat Fieber und kann seit zwei Tagen nichts essen.",
             "de", "es", "Mi hijo tiene fiebre y no puede comer desde hace dos días.", "formal"),
            ("Wo ist hier der nächste Supermarkt?",
             "de", "es", "¿Dónde está el supermercado más cercano?", "colloquial"),
        ]
    },
    "it": {
        "name": "Italian",
        "pairs": [
            ("Können Sie mir bitte erklären, wie ich den Antrag ausfüllen muss?",
             "de", "it", "Può spiegarmi per favore come devo compilare la domanda?", "formal"),
            ("Ich find den Ausgang nicht, wo muss ich lang?",
             "de", "it", "Non trovo l'uscita, da che parte devo andare?", "colloquial"),
        ]
    },
    "pt": {
        "name": "Portuguese",
        "pairs": [
            ("Ich möchte mich für den Sprachkurs anmelden.",
             "de", "pt", "Gostaria de me inscrever no curso de idiomas.", "formal"),
        ]
    },
    "nl": {
        "name": "Dutch",
        "pairs": [
            ("Können Sie mir den Weg zum Krankenhaus zeigen?",
             "de", "nl", "Kunt u mij de weg naar het ziekenhuis wijzen?", "formal"),
        ]
    },
    "pl": {
        "name": "Polish",
        "pairs": [
            ("Ich brauche eine Überweisung zum Facharzt.",
             "de", "pl", "Potrzebuję skierowania do specjalisty.", "formal"),
        ]
    },
    "ja": {
        "name": "Japanese",
        "pairs": [
            ("Ich hätte gerne ein Zimmer mit Frühstück für zwei Nächte.",
             "de", "ja", "朝食付きの部屋を二泊でお願いしたいのですが。", "formal"),
        ]
    },
    "ko": {
        "name": "Korean",
        "pairs": [
            ("Wo ist die nächste U-Bahn-Station?",
             "de", "ko", "가장 가까운 지하철역이 어디에 있나요?", "formal"),
        ]
    },
    "zh": {
        "name": "Chinese",
        "pairs": [
            ("Ich möchte ein Konto bei dieser Bank eröffnen.",
             "de", "zh", "我想在这家银行开一个账户。", "formal"),
        ]
    },
    "hi": {
        "name": "Hindi",
        "pairs": [
            ("Ich suche eine Wohnung für meine Familie mit drei Kindern.",
             "de", "hi", "मैं अपने तीन बच्चों वाले परिवार के लिए एक अपार्टमेंट ढूंढ रहा हूँ।", "formal"),
        ]
    },
    "da": {
        "name": "Danish",
        "pairs": [
            ("Können Sie mir bitte den Weg zum Bahnhof zeigen?",
             "de", "da", "Kan du vise mig vejen til banegården?", "formal"),
        ]
    },
    "el": {
        "name": "Greek",
        "pairs": [
            ("Ich möchte ein Zimmer für zwei Nächte reservieren.",
             "de", "el", "Θα ήθελα να κλείσω ένα δωμάτιο για δύο βράδια.", "formal"),
        ]
    },
    "fi": {
        "name": "Finnish",
        "pairs": [
            ("Ich würde gerne einen Termin beim Zahnarzt vereinbaren.",
             "de", "fi", "Haluaisin varata ajan hammaslääkärille.", "formal"),
        ]
    },
    "he": {
        "name": "Hebrew",
        "pairs": [
            ("Können Sie mir sagen, wann das Museum öffnet?",
             "de", "he", "האם תוכל לומר לי מתי המוזיאון נפתח?", "formal"),
        ]
    },
    "ms": {
        "name": "Malay",
        "pairs": [
            ("Wo kann ich ein Taxi zum Flughafen bekommen?",
             "de", "ms", "Di mana saya boleh mendapatkan teksi ke lapangan terbang?", "formal"),
        ]
    },
    "no": {
        "name": "Norwegian",
        "pairs": [
            ("Das Wetter ist heute sehr schön, perfekt für einen Spaziergang.",
             "de", "no", "Været er veldig fint i dag, perfekt for en spasertur.", "formal"),
        ]
    },
    "sv": {
        "name": "Swedish",
        "pairs": [
            ("Ich brauche ein Rezept für meine Medikamente.",
             "de", "sv", "Jag behöver ett recept för mina mediciner.", "formal"),
        ]
    },
    "sw": {
        "name": "Swahili",
        "pairs": [
            ("Ich brauche Hilfe, ich habe mein Geld verloren.",
             "de", "sw", "Ninahitaji msaada, nimepoteza pesa zangu.", "formal"),
        ]
    },
}

# ── Ollama API ────────────────────────────────────────────────────────
def ollama_generate(url, model, prompt, timeout=120):
    payload = json.dumps({
        "model": model, "prompt": prompt, "stream": False,
        "options": {"temperature": 0.1, "num_predict": 256},
    }).encode()
    req = urllib.request.Request(
        f"{url}/api/generate", data=payload,
        headers={"Content-Type": "application/json"},
    )
    try:
        t0 = time.monotonic()
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        elapsed = time.monotonic() - t0
        text = data.get("response", "").strip()
        if "<think>" in text:
            parts = text.split("</think>")
            text = parts[-1].strip() if len(parts) > 1 else text
        if text.startswith('"') and text.endswith('"'):
            text = text[1:-1]
        return text, elapsed
    except Exception as e:
        return f"ERROR: {e}", 0.0

def check_ollama(url):
    try:
        with urllib.request.urlopen(f"{url}/api/tags", timeout=5) as resp:
            data = json.loads(resp.read())
        return [m["name"] for m in data.get("models", [])]
    except Exception as e:
        print(f"Cannot connect to Ollama at {url}: {e}")
        sys.exit(1)

# ── Main ──────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="InKonnect Chatterbox Language Benchmark")
    p.add_argument("--ollama-url", default="http://localhost:11434")
    p.add_argument("--models", nargs="+", default=DEFAULT_MODELS)
    p.add_argument("--langs", nargs="+", default=None)
    p.add_argument("--quick", action="store_true", help="1 sentence per language")
    p.add_argument("--output", default="bench-results.json")
    args = p.parse_args()

    available = check_ollama(args.ollama_url)
    print(f"Ollama: {args.ollama_url}")
    print(f"Models: {', '.join(available)}\n")

    models = [m for m in args.models if any(m in a for a in available)]
    missing = [m for m in args.models if m not in models]
    for m in missing:
        print(f"  ⚠ '{m}' not found, skipping")
    if not models:
        print("No models available!"); sys.exit(1)

    langs = [l for l in (args.langs or list(TESTS.keys())) if l in TESTS]
    total = sum(len(TESTS[l]["pairs"][:1] if args.quick else TESTS[l]["pairs"]) for l in langs) * len(models)
    print(f"\n{total} translations | {len(models)} models | {len(langs)} languages\n")
    print("=" * 90)

    results = {}
    speeds = {m: [] for m in models}

    for lc in langs:
        lang = TESTS[lc]
        pairs = lang["pairs"][:1] if args.quick else lang["pairs"]
        print(f"\n{'─'*90}\n  {lang['name']} ({lc})\n{'─'*90}")
        results[lc] = {"name": lang["name"], "tests": []}

        for src, sl, tl, ref, reg in pairs:
            print(f"\n  [{reg}] {sl}→{tl}: \"{src[:70]}{'...' if len(src)>70 else ''}\"")
            print(f"  REF: \"{ref[:70]}{'...' if len(ref)>70 else ''}\"")
            tr = {"source": src, "src_lang": sl, "tgt_lang": tl,
                  "reference": ref, "register": reg, "results": {}}

            for model in models:
                prompt = build_prompt(model, src, sl, tl)
                translation, elapsed = ollama_generate(args.ollama_url, model, prompt)
                speeds[model].append(elapsed)
                tr["results"][model] = {"translation": translation, "time": round(elapsed, 2)}
                disp = translation[:65] + "..." if len(translation) > 65 else translation
                ok = "✓" if not translation.startswith("ERROR") else "✗"
                print(f"    {ok} {model:<20s} ({elapsed:>5.1f}s) → {disp}")

            results[lc]["tests"].append(tr)

    # Speed summary
    print(f"\n\n{'='*90}\n  SPEED SUMMARY\n{'='*90}")
    print(f"  {'Model':<25s} {'Avg':>8s} {'Min':>8s} {'Max':>8s}")
    print(f"  {'─'*50}")
    for m in models:
        t = [x for x in speeds[m] if x > 0]
        if t:
            print(f"  {m:<25s} {sum(t)/len(t):>7.1f}s {min(t):>7.1f}s {max(t):>7.1f}s")

    # Markdown table
    print(f"\n\n{'='*90}\n  MARKDOWN RANKING TABLE\n{'='*90}\n")
    h = "| Language | " + " | ".join(models) + " |"
    s = "|---|" + "|".join("---|" for _ in models)
    print(h); print(s)
    for lc in langs:
        lang = TESTS[lc]
        cells = []
        for m in models:
            times = [t["results"].get(m, {}).get("time", 0) for t in results[lc]["tests"]]
            times = [t for t in times if t > 0]
            cells.append(f"{sum(times)/len(times):.1f}s" if times else "—")
        print(f"| {lang['name']:<15s} | " + " | ".join(cells) + " |")

    # Save
    out = {"timestamp": datetime.now().isoformat(), "models": models,
           "results": results, "speed": {
               m: round(sum(t for t in speeds[m] if t>0) / max(len([t for t in speeds[m] if t>0]),1), 2)
               for m in models}}
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {args.output}")
    print(f"\n⚠  Review translations manually for QUALITY!")
    print(f"   Speed is automatic, but accuracy/fluency needs human eyes.")

if __name__ == "__main__":
    main()
