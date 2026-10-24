"""Speed and cost check for Problem 9 ("faster and cheaper").

Run from backend/:  python benchmark.py [label]
Asks the agent the same questions and records time and tokens per question,
plus how long the database tools take. Results are appended to
output/benchmark.json so before/after runs can be compared.
"""

from __future__ import annotations

import asyncio
import json
import statistics
import sys
import time
from datetime import datetime
from pathlib import Path

import agent
import tools
from pydantic_ai.usage import UsageLimits

QUESTIONS = [
    "What hoodies do you have?",
    "Do you have the Crew Left Chest Hoodie in medium?",
    "How much is the Yale Dad T Shirt?",
    "Show me gray t-shirts under $40",
]
OUT = Path(__file__).resolve().parent.parent / "output" / "benchmark.json"


def tool_timing(n: int = 200) -> dict:
    """Average milliseconds per call for the database tools (no AI involved)."""
    calls = {
        "search_catalogue": lambda: tools.search_catalogue(category="hoodie"),
        "check_stock": lambda: tools.check_stock("crew left chest hoodie", "M"),
        "get_product_info": lambda: tools.get_product_info("yale dad t shirt"),
    }
    out = {}
    for name, fn in calls.items():
        start = time.perf_counter()
        for _ in range(n):
            fn()
        out[name] = round((time.perf_counter() - start) / n * 1000, 3)
    return out


ROUNDS = 3  # each question is asked this many times; we keep the median time


async def agent_timing() -> list[dict]:
    rows = []
    for q in QUESTIONS:
        times, last = [], None
        for _ in range(ROUNDS):
            deps = agent.ShopDeps()
            start = time.perf_counter()
            last = await agent.agent.run(
                q, deps=deps, usage_limits=UsageLimits(request_limit=agent.MAX_REQUESTS),
                # skip Portkey's response cache so we time the real model
                model_settings={**agent.MODEL_SETTINGS, "extra_headers": {"x-portkey-cache-force-refresh": "true"}},
            )
            times.append(time.perf_counter() - start)
        usage = last.usage
        rows.append({
            "question": q,
            "median_seconds": round(statistics.median(times), 2),
            "all_seconds": [round(t, 2) for t in times],
            "model_calls": usage.requests,
            "input_tokens": usage.input_tokens,
            "cached_input_tokens": usage.cache_read_tokens,
            "uncached_input_tokens": usage.input_tokens - usage.cache_read_tokens,
            "output_tokens": usage.output_tokens,
            "reply": last.output.reply[:160],
        })
        print(rows[-1])
    return rows


def main() -> None:
    label = sys.argv[1] if len(sys.argv) > 1 else "run"
    run = {"label": label, "time": datetime.now().isoformat(timespec="seconds"),
           "tool_ms_per_call": tool_timing(), "agent": asyncio.run(agent_timing())}
    a = run["agent"]
    run["totals"] = {
        "avg_median_seconds": round(sum(r["median_seconds"] for r in a) / len(a), 2),
        "avg_input_tokens": round(sum(r["input_tokens"] for r in a) / len(a)),
        "avg_output_tokens": round(sum(r["output_tokens"] for r in a) / len(a)),
        "avg_uncached_input_tokens": round(sum(r["uncached_input_tokens"] for r in a) / len(a)),
    }
    print(run["tool_ms_per_call"], run["totals"])
    runs = json.loads(OUT.read_text()) if OUT.exists() else []
    runs.append(run)
    OUT.write_text(json.dumps(runs, indent=2))


if __name__ == "__main__":
    main()
