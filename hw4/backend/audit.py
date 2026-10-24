"""Append-only audit trail of agent activity (Problem 12).

One JSON object per chat message is added to output/audit_trail.json. The file
is a JSON array, but we never rewrite earlier entries: a new entry is written
over the closing "]" at the end of the file, followed by a new "]". Restarting
the server or re-running tests only adds to it.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path
from typing import Any

from pydantic import BaseModel
from pydantic_ai.messages import ModelRequest, ModelResponse, ToolCallPart, ToolReturnPart

AUDIT_PATH = Path(__file__).resolve().parent.parent / "output" / "audit_trail.json"
SHORT = 200  # characters kept for args and results
_lock = threading.Lock()


def prices_in(value: Any) -> set[float]:
    """Every price-like number in a tool result (for the price-honesty check)."""
    if isinstance(value, BaseModel):
        value = value.model_dump()
    found: set[float] = set()
    if isinstance(value, dict):
        for k, v in value.items():
            if k in ("price", "min_price", "max_price") and isinstance(v, (int, float)):
                found.add(round(float(v), 2))
            else:
                found |= prices_in(v)
    elif isinstance(value, list):
        for v in value:
            found |= prices_in(v)
    return found


def short(value: Any, limit: int = SHORT) -> str:
    if isinstance(value, BaseModel):
        value = value.model_dump(exclude_none=True)
    text = value if isinstance(value, str) else json.dumps(value, default=str, ensure_ascii=False)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def summarize(content: Any) -> str:
    """A readable one-line result for common tool outputs; falls back to short JSON."""
    data = content.model_dump(exclude_none=True) if isinstance(content, BaseModel) else content
    if isinstance(data, dict):
        if "total_matches" in data:
            names = ", ".join(r["name"] for r in data.get("results", [])[:4])
            return short(f"{data['total_matches']} matches: {names}")
        if "alternatives" in data:
            alts = ", ".join(f"{a['name']} ({a['quantity_in_size']})" for a in data["alternatives"][:4])
            return short(f"{data.get('name')} {data.get('size')}={data.get('original_quantity')}; alternatives: {alts}")
        if "sizes" in data and data.get("status") == "found":
            stock = " ".join(f"{s['size']}:{s['quantity']}" for s in data["sizes"])
            return short(f"{data.get('name')} ${data.get('price')} | {stock}")
        if data.get("status") == "found" and "product" in data:
            p = data["product"]
            return short(f"{p['name']} ${p['price']} colors={','.join(p['colors'])}")
        if data.get("status") in ("ambiguous", "not_found"):
            return short(f"{data['status']}: " + ", ".join(c["name"] for c in data.get("candidates", [])))
    return short(data)


def tool_steps(messages: list) -> list[dict]:
    """Pair each tool call with its result, in loop order."""
    calls: dict[str, dict] = {}
    steps: list[dict] = []
    for m in messages:
        if isinstance(m, ModelResponse):
            for part in m.parts:
                if isinstance(part, ToolCallPart) and part.tool_name != "final_result":
                    step = {"tool": part.tool_name, "args": short(part.args_as_dict(), 160), "result": None}
                    calls[part.tool_call_id] = step
                    steps.append(step)
        elif isinstance(m, ModelRequest):
            for part in m.parts:
                if isinstance(part, ToolReturnPart) and part.tool_call_id in calls:
                    calls[part.tool_call_id]["result"] = summarize(part.content)
    return steps


def append(entry: dict) -> None:
    """Add one entry to the end of the JSON array without touching earlier entries."""
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    blob = json.dumps(entry, ensure_ascii=False, indent=2)
    blob = "\n".join("  " + line for line in blob.splitlines())
    with _lock:
        if not AUDIT_PATH.exists() or AUDIT_PATH.stat().st_size < 2:
            AUDIT_PATH.write_text(f"[\n{blob}\n]\n", encoding="utf-8")
            return
        with AUDIT_PATH.open("r+b") as f:
            f.seek(0, 2)
            pos = f.tell()
            # walk back over trailing whitespace to the closing bracket
            while pos > 0:
                pos -= 1
                f.seek(pos)
                ch = f.read(1)
                if ch not in b" \n\r\t":
                    break
            if ch != b"]":
                raise ValueError("audit_trail.json does not end with ']'; refusing to overwrite it")
            # is the array empty ("[]")? then no comma before the new entry
            before = pos
            prev = b"["
            while before > 0:
                before -= 1
                f.seek(before)
                prev = f.read(1)
                if prev not in b" \n\r\t":
                    break
            sep = "\n" if prev == b"[" else ",\n"
            f.seek(pos)
            f.truncate()
            f.write(f"{sep}{blob}\n]\n".encode("utf-8"))
