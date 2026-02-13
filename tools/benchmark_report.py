#!/usr/bin/env python3
"""Generate a benchmark report from pipeline JSONL logs.

Reads all .jsonl files from benchmarks/ directory, groups by provider
combination, and outputs a Markdown table with latency statistics.

Usage:
    python tools/benchmark_report.py
    python tools/benchmark_report.py --json > report.json
"""

import json
import statistics
import sys
from pathlib import Path

BENCHMARKS_DIR = Path(__file__).resolve().parent.parent / "benchmarks"


def load_entries() -> list[dict]:
    entries: list[dict] = []
    if not BENCHMARKS_DIR.exists():
        return entries
    for f in sorted(BENCHMARKS_DIR.glob("*.jsonl")):
        for line in f.read_text().splitlines():
            line = line.strip()
            if line:
                entries.append(json.loads(line))
    return entries


def compute_stats(values: list[int]) -> dict:
    if not values:
        return {"avg": 0, "median": 0, "p95": 0, "min": 0, "max": 0, "n": 0}
    s = sorted(values)
    p95_idx = int(len(s) * 0.95)
    return {
        "avg": int(statistics.mean(s)),
        "median": int(statistics.median(s)),
        "p95": s[min(p95_idx, len(s) - 1)],
        "min": s[0],
        "max": s[-1],
        "n": len(s),
    }


def group_entries(entries: list[dict]) -> dict[str, list[dict]]:
    groups: dict[str, list[dict]] = {}
    for e in entries:
        key = f"{e.get('stt_provider', '?')} | {e.get('translate_provider', '?')} | {e.get('tts_provider', '?')}"
        groups.setdefault(key, []).append(e)
    return groups


def print_markdown(groups: dict[str, list[dict]]) -> None:
    print("# Benchmark Report\n")
    print(f"Total entries: {sum(len(v) for v in groups.values())}\n")
    print("| Providers | N | STT avg | Translate avg | TTS avg | Total avg | Total p95 |")
    print("|-----------|---|---------|---------------|---------|-----------|-----------|")
    for key, entries in sorted(groups.items()):
        stt = compute_stats([e["stt_ms"] for e in entries if e.get("stt_ms") is not None])
        tr = compute_stats([e["translate_ms"] for e in entries if e.get("translate_ms") is not None])
        tts = compute_stats([e["tts_ms"] for e in entries if e.get("tts_ms") is not None])
        total = compute_stats([e["total_ms"] for e in entries if e.get("total_ms") is not None])
        n = total["n"]
        print(f"| {key} | {n} | {stt['avg']}ms | {tr['avg']}ms | {tts['avg']}ms | {total['avg']}ms | {total['p95']}ms |")
    print()


def print_json(groups: dict[str, list[dict]]) -> None:
    report = {}
    for key, entries in groups.items():
        report[key] = {
            "n": len(entries),
            "stt": compute_stats([e["stt_ms"] for e in entries if e.get("stt_ms") is not None]),
            "translate": compute_stats([e["translate_ms"] for e in entries if e.get("translate_ms") is not None]),
            "tts": compute_stats([e["tts_ms"] for e in entries if e.get("tts_ms") is not None]),
            "total": compute_stats([e["total_ms"] for e in entries if e.get("total_ms") is not None]),
        }
    print(json.dumps(report, indent=2))


def main() -> None:
    entries = load_entries()
    if not entries:
        print("No benchmark data found in benchmarks/", file=sys.stderr)
        sys.exit(1)

    groups = group_entries(entries)

    if "--json" in sys.argv:
        print_json(groups)
    else:
        print_markdown(groups)


if __name__ == "__main__":
    main()
