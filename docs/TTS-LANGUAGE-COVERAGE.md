# Dolmtschr — TTS Sprachunterstützung

Übersicht welche Sprachen von welchem TTS-Provider als Sprachausgabe unterstützt werden.
Dieses Dokument dient als Referenz für die UI (Language Selector, Quick Language Chips) und für die Transparenz gegenüber Kunden.

> **Legende:**
> 🟢 Unterstützt — Sprachausgabe verfügbar
> ⚪ Nicht unterstützt — nur Textausgabe möglich

---

## Chatterbox Multilingual (lokal, self-hosted)

23 Sprachen · Model: `chatterbox-tts v0.1.4 multilingual` · ~3GB VRAM · MIT Lizenz

| Sprache | Code | Chatterbox |
|---------|------|:----------:|
| Arabisch | ar | 🟢 |
| Chinesisch | zh | 🟢 |
| Dänisch | da | 🟢 |
| Deutsch | de | 🟢 |
| Englisch | en | 🟢 |
| Finnisch | fi | 🟢 |
| Französisch | fr | 🟢 |
| Griechisch | el | 🟢 |
| Hebräisch | he | 🟢 |
| Hindi | hi | 🟢 |
| Italienisch | it | 🟢 |
| Japanisch | ja | 🟢 |
| Koreanisch | ko | 🟢 |
| Malaiisch | ms | 🟢 |
| Niederländisch | nl | 🟢 |
| Norwegisch | no | 🟢 |
| Polnisch | pl | 🟢 |
| Portugiesisch | pt | 🟢 |
| Russisch | ru | 🟢 |
| Schwedisch | sv | 🟢 |
| Spanisch | es | 🟢 |
| Suaheli | sw | 🟢 |
| Türkisch | tr | 🟢 |

### Nicht unterstützt (Wien-relevante Sprachen)

| Sprache | Code | Chatterbox | Hinweis |
|---------|------|:----------:|---------|
| Ukrainisch | uk | ⚪ | Große Community in Wien |
| Farsi/Dari | fa | ⚪ | Wichtig für NGO + Medical |
| Somali | so | ⚪ | Wichtig für NGO |
| Bosnisch/Kroatisch/Serbisch | bs/hr/sr | ⚪ | Große Community in Wien |
| Rumänisch | ro | ⚪ | EU-Bürger, wachsend |
| Ungarisch | hu | ⚪ | Nachbarland |
| Tschechisch | cs | ⚪ | Nachbarland |
| Slowakisch | sk | ⚪ | Nachbarland |
| Bulgarisch | bg | ⚪ | EU-Bürger |

---

## ElevenLabs (Cloud API, kostenpflichtig)

### Eleven v3 — 74 Sprachen

Aktuellstes Modell, höchste Qualität, emotionale Range. Alle v3-Sprachen:

| Sprache | Code | v3 |
|---------|------|:--:|
| Afrikaans | af | 🟢 |
| Arabisch | ar | 🟢 |
| Armenisch | hy | 🟢 |
| Assamesisch | as | 🟢 |
| Aserbaidschanisch | az | 🟢 |
| Belarussisch | be | 🟢 |
| Bengali | bn | 🟢 |
| Bosnisch | bs | 🟢 |
| Bulgarisch | bg | 🟢 |
| Cebuano | ceb | 🟢 |
| Chichewa | ny | 🟢 |
| Chinesisch | zh | 🟢 |
| Dänisch | da | 🟢 |
| Deutsch | de | 🟢 |
| Englisch | en | 🟢 |
| Estnisch | et | 🟢 |
| Filipino | fil | 🟢 |
| Finnisch | fi | 🟢 |
| Französisch | fr | 🟢 |
| Galicisch | gl | 🟢 |
| Georgisch | ka | 🟢 |
| Griechisch | el | 🟢 |
| Gujarati | gu | 🟢 |
| Hausa | ha | 🟢 |
| Hebräisch | he | 🟢 |
| Hindi | hi | 🟢 |
| Indonesisch | id | 🟢 |
| Irisch | ga | 🟢 |
| Isländisch | is | 🟢 |
| Italienisch | it | 🟢 |
| Japanisch | ja | 🟢 |
| Javanisch | jv | 🟢 |
| Kannada | kn | 🟢 |
| Kasachisch | kk | 🟢 |
| Katalanisch | ca | 🟢 |
| Kirgisisch | ky | 🟢 |
| Koreanisch | ko | 🟢 |
| Kroatisch | hr | 🟢 |
| Lettisch | lv | 🟢 |
| Lingala | ln | 🟢 |
| Litauisch | lt | 🟢 |
| Luxemburgisch | lb | 🟢 |
| Malaiisch | ms | 🟢 |
| Malayalam | ml | 🟢 |
| Mazedonisch | mk | 🟢 |
| Niederländisch | nl | 🟢 |
| Norwegisch | no | 🟢 |
| Polnisch | pl | 🟢 |
| Portugiesisch | pt | 🟢 |
| Rumänisch | ro | 🟢 |
| Russisch | ru | 🟢 |
| Schwedisch | sv | 🟢 |
| Serbisch | sr | 🟢 |
| Slowakisch | sk | 🟢 |
| Spanisch | es | 🟢 |
| Suaheli | sw | 🟢 |
| Tamil | ta | 🟢 |
| Tschechisch | cs | 🟢 |
| Türkisch | tr | 🟢 |
| Ukrainisch | uk | 🟢 |
| Ungarisch | hu | 🟢 |
| Vietnamesisch | vi | 🟢 |
| + weitere bis 74 | | 🟢 |

### Multilingual v2 — 32 Sprachen

Günstigeres Modell, trotzdem hervorragende Qualität:

en, pl, de, es, fr, it, hi, pt, zh, ko, ru, nl, tr, sv, id, fil, ja, uk, el, cs, fi, ro, da, bg, ms, sk, hr, ar, ta, vi, hu, no

### Flash v2.5 — 32 Sprachen, <75ms Latenz

Selbe Sprachen wie Multilingual v2, ultra-schnell.

---

## Piper (lokal, CPU-only)

37 Sprachen · VITS-basiert · ONNX Runtime · ~15-120MB pro Voice · MIT Lizenz
Läuft auf CPU, kein GPU nötig. Ultra-schnell (<50ms). Qualität geringer als Chatterbox, aber brauchbar.

**Alle Piper-Sprachen:**
ar, ca, cs, cy, da, de, el, en, es, **fa**, fi, fr, hi, hu, is, it, ka, kk, lb, lv, ne, nl, no, pl, pt, ro, ru, sk, sl, sr, sv, sw, te, tr, uk, vi, zh

**Wien-relevante Highlights die Chatterbox fehlen:**
- ✅ **Farsi (fa_IR)** — der einzige lokale TTS-Provider mit Farsi!
- ✅ Ukrainisch (uk_UA), Serbisch (sr_RS), Slowenisch (sl_SI)
- ✅ Tschechisch (cs_CZ), Slowakisch (sk_SK), Ungarisch (hu_HU), Rumänisch (ro_RO)
- ❌ Kein Somali, kein Bosnisch (aber Serbisch ja), kein Koreanisch, kein Japanisch

---

## Vergleich: Wien-relevante Sprachen

Die wichtigsten Sprachen für Dolmtschr-Kunden in Wien im direkten Vergleich:

| Sprache | Code | Chatterbox | Piper | ElevenLabs v2 | ElevenLabs v3 |
|---------|------|:----------:|:-----:|:-------------:|:-------------:|
| Deutsch | de | 🟢 | 🟢 | 🟢 | 🟢 |
| Englisch | en | 🟢 | 🟢 | 🟢 | 🟢 |
| Arabisch | ar | 🟢 | 🟢 | 🟢 | 🟢 |
| Türkisch | tr | 🟢 | 🟢 | 🟢 | 🟢 |
| Russisch | ru | 🟢 | 🟢 | 🟢 | 🟢 |
| Polnisch | pl | 🟢 | 🟢 | 🟢 | 🟢 |
| **Ukrainisch** | uk | ⚪ | 🟢 | 🟢 | 🟢 |
| **Farsi** | fa | ⚪ | 🟢 | ⚪ | ⚪ |
| **Somali** | so | ⚪ | ⚪ | ⚪ | ⚪ |
| **Bosnisch** | bs | ⚪ | ⚪ | ⚪ | 🟢 |
| **Kroatisch** | hr | ⚪ | ⚪ | 🟢 | 🟢 |
| **Serbisch** | sr | ⚪ | 🟢 | ⚪ | 🟢 |
| Rumänisch | ro | ⚪ | 🟢 | 🟢 | 🟢 |
| Ungarisch | hu | ⚪ | 🟢 | 🟢 | 🟢 |
| Tschechisch | cs | ⚪ | 🟢 | 🟢 | 🟢 |
| Slowakisch | sk | ⚪ | 🟢 | 🟢 | 🟢 |
| Bulgarisch | bg | ⚪ | ⚪ | 🟢 | 🟢 |
| Chinesisch | zh | 🟢 | 🟢 | 🟢 | 🟢 |
| Japanisch | ja | 🟢 | ⚪ | 🟢 | 🟢 |
| Koreanisch | ko | 🟢 | ⚪ | 🟢 | 🟢 |
| Französisch | fr | 🟢 | 🟢 | 🟢 | 🟢 |
| Spanisch | es | 🟢 | 🟢 | 🟢 | 🟢 |
| Italienisch | it | 🟢 | 🟢 | 🟢 | 🟢 |
| Hindi | hi | 🟢 | 🟢 | 🟢 | 🟢 |

---

## UI-Darstellung

### Im Language Selector

Jede Sprache zeigt ein kleines Badge neben dem Flag:

```
[🇸🇦 AR 🔊 ▾]     ← Sprachausgabe verfügbar (Chatterbox)
[🇺🇦 UK 💬 ▾]     ← Nur Textausgabe
[🇺🇦 UK 🔊 ▾]     ← Sprachausgabe via ElevenLabs (wenn aktiv)
```

### In den Quick Language Chips

```
Medical Profile:
[AR 🔊] [TR 🔊] [RU 🔊] [UK 💬] [FA 💬]
                                        ↑ kein TTS-Provider hat Farsi
```

Wenn ElevenLabs aktiv:
```
Medical Profile (mit ElevenLabs):
[AR 🔊] [TR 🔊] [RU 🔊] [UK 🔊] [FA 💬]
                           ↑ jetzt 🔊 dank ElevenLabs v3
```

### Upselling-Hinweis (optional)

Wenn User eine ⚪-Sprache wählt und kein ElevenLabs konfiguriert ist:

> „Sprachausgabe für Ukrainisch ist mit ElevenLabs verfügbar.
>  Mehr Info unter Einstellungen → TTS Provider."

---

## Zusammenfassung

| Provider | Sprachen | Hosting | Latenz | Kosten | DSGVO |
|----------|----------|---------|--------|--------|-------|
| Chatterbox | 23 | Lokal (GPU) | 300-500ms | Strom | ✅ 100% |
| ElevenLabs v3 | 74 | Cloud (US) | ~200ms | ab €5/mo | 🟡 US-Firma |
| ElevenLabs v2/Flash | 32 | Cloud (US) | <75ms | ab €5/mo | 🟡 US-Firma |
| Piper | 37 | Lokal (CPU) | <50ms | Strom | ✅ 100% |

**Empfehlung für Kunden:**
- **Datensouverän:** Chatterbox + Piper → lokal, 0€ Cloud, 44 Sprachen (23+37 mit Überschneidung)
- **Datensouverän + Farsi:** Chatterbox + Piper Fallback → Piper ist der einzige lokale Provider mit Farsi!
- **Maximum Coverage:** Chatterbox + Piper + ElevenLabs v3 → 74+ Sprachen, alles abgedeckt
- **Budget:** Chatterbox + Piper only → keine Cloud-Kosten, trotzdem breite Abdeckung

**Einzige Lücke über ALLE Provider:** Somali (so) — kein TTS-Provider unterstützt Sprachausgabe für Somali.

---

## Fallback-Strategie (v0.8)

Chatterbox ist Primary TTS (beste Qualität, Voice Cloning). Piper springt automatisch ein wenn Chatterbox die Sprache nicht kann. Kein manueller Wechsel nötig.

**Pipeline-Logik:**
```
TTS Request (Sprache X)
  │
  ├─ Chatterbox unterstützt X? → Chatterbox (GPU, beste Qualität)
  ├─ Piper unterstützt X?     → Piper (CPU, schnell, Auto-Download Voice)
  ├─ ElevenLabs aktiv?       → ElevenLabs Cloud (wenn konfiguriert)
  └─ Kein TTS möglich       → Nur Text-Ausgabe (💬 Badge in UI)
```

**Konkrete Piper-Fallback-Sprachen (14 Sprachen die Chatterbox fehlen):**

| Sprache | Code | Piper Voice (HuggingFace) | Größe |
|---------|------|--------------------------|--------|
| Ukrainisch | uk_UA | ukrainian_tts (medium) | ~50 MB |
| Farsi | fa_IR | amir (medium) | ~50 MB |
| Serbisch | sr_RS | serbski_institut (medium) | ~50 MB |
| Tschechisch | cs_CZ | jirka (medium) | ~50 MB |
| Slowakisch | sk_SK | lili (medium) | ~50 MB |
| Ungarisch | hu_HU | anna / imre (medium) | ~50 MB |
| Rumänisch | ro_RO | mihai (medium) | ~50 MB |
| Slowenisch | sl_SI | artur (medium) | ~50 MB |
| Katalanisch | ca_ES | baez (medium) | ~50 MB |
| Walisisch | cy_GB | gwryw (medium) | ~50 MB |
| Isländisch | is_IS | various (medium) | ~50 MB |
| Georgisch | ka_GE | natia (medium) | ~50 MB |
| Kasachisch | kk_KZ | various | ~50 MB |
| Lettisch | lv_LV | various | ~50 MB |

**Gesamt Speicherbedarf:** ~700 MB für alle 14 Fallback-Voices (medium quality).
Voices werden on-demand heruntergeladen beim ersten Aufruf einer Sprache.

**Ergebnis:** 41 Sprachen Sprachausgabe, komplett lokal, 0€ Cloud-Kosten.
