"""Campus Customs shop assistant: PydanticAI agent entry and wiring.

main.py's /api/chat calls run_chat(). The system prompt is prompts/prompt.md,
the tools live in tools.py, and the types in models.py.
"""

from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")  # keep the server log clean

from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, ToolReturnPart, UserPromptPart
from pydantic_ai.models.openai import OpenAIResponsesModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.usage import UsageLimits

import audit
import safety
import tools
from models import (
    AlternativesResult,
    ChatReply,
    ChatTurn,
    Customer,
    PageContext,
    ProductInfo,
    ProductInfoResult,
    SearchResult,
    ShopAnswer,
    ShopOverview,
    StockResult,
)

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent.parent / ".env")  # MGT409/.env holds PORTKEY_API_KEY

PROMPT_PATH = HERE / "prompts" / "prompt.md"
# The shop has its own setting so a shell-wide OPENAI_MODEL (set for other
# projects) can't silently switch models. Found during Problem 12.
MODEL_NAME = os.getenv("CAMPUS_CUSTOMS_MODEL") or "gpt-6-luna"
MAX_REQUESTS = 6   # model calls per message, so a confused agent can't loop forever
MAX_TOOL_CALLS = 8      # tool calls per message (Problem 12)
MAX_TOTAL_TOKENS = 40_000  # token budget per message; a normal one uses ~5–8k (Problem 12)
MAX_HISTORY = 12   # earlier turns sent back to the model (about 6 back-and-forths)
# Problem 9 (faster and cheaper): our tools do the lookups, so the model needs
# little hidden "thinking" per step. Low reasoning effort cuts time and tokens.
MODEL_SETTINGS: dict = {"openai_reasoning_effort": "low"}

log = logging.getLogger("campus_customs.agent")


def make_model() -> OpenAIResponsesModel:
    """Portkey-backed model. The key comes from .env, stays on the server, and is never printed.

    Uses OpenAI's Responses API: gpt-6-luna rejects tool calls on the older
    Chat Completions API ("Function tools with reasoning_effort are not supported").
    """
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is missing from the .env file.")
    client = AsyncOpenAI(
        api_key=key,
        base_url="https://api.portkey.ai/v1",
        timeout=60,
        max_retries=2,
        default_headers={"x-portkey-api-key": key},
    )
    return OpenAIResponsesModel(MODEL_NAME, provider=OpenAIProvider(openai_client=client))


@dataclass
class ShopDeps:
    """Per-message context the agent and its tools can see.

    customer: the logged-in shopper (None for guests), from the login token.
    page: where the shopper is on the site; page_product is the product they're
    looking at, looked up from the database when they're on a product page.
    """
    customer: Customer | None = None
    page: PageContext | None = None
    page_product: ProductInfo | None = None
    tools_used: list[str] = field(default_factory=list)
    seen_ids: set[str] = field(default_factory=set)  # product_ids any tool returned this turn
    last_search_ids: list[str] = field(default_factory=list)  # results of the latest search_catalogue


agent = Agent(
    make_model(),
    deps_type=ShopDeps,
    output_type=ShopAnswer,  # reply text + product_ids to show as cards
)

_prompt_cache: dict = {"stamp": None, "text": ""}


@agent.instructions
def base_prompt() -> str:
    """prompts/prompt.md, re-read whenever the file changes (uvicorn --reload only
    watches .py files, so prompt edits used to need a restart; found in Problem 12)."""
    stamp = PROMPT_PATH.stat().st_mtime_ns
    if _prompt_cache["stamp"] != stamp:
        _prompt_cache.update(stamp=stamp, text=PROMPT_PATH.read_text(encoding="utf-8"))
    return _prompt_cache["text"]


@agent.instructions
def customer_and_page(ctx: RunContext[ShopDeps]) -> str:
    """Added to the system prompt on every message: who is chatting and what page they're on."""
    d = ctx.deps
    if d.customer:
        who = (f"The shopper is logged in as {d.customer.first_name} {d.customer.last_name} "
               f"({d.customer.email}). You may greet them by first name. Their past chats "
               f"with you are in the message history.")
    else:
        who = "The shopper is a guest (not logged in). You don't know their name or email."
    if d.page_product:
        p = d.page_product
        where = (f'They are viewing the product page for "{p.name}" (product_id: {p.product_id}, '
                 f'${p.price:.2f}, colors: {", ".join(p.colors) or "not recorded"}). '
                 f'If they say "this", "it", or "this one" without naming an item, they mean THIS product, '
                 f'even if earlier messages were about other items. The page they are on now wins over chat history.')
    elif d.page:
        where = f"They are on the {d.page.path} page (not a single product page)."
    else:
        where = "Their current page is unknown."
    # Problem 9: this note replaces the get_customer_profile / get_current_page_product
    # tools. It's added after the fixed prompt, so the fixed part stays cacheable.
    if d.page_product:
        d.seen_ids.add(d.page_product.product_id)
    return f"## Current shopper and page\n\n{who}\n\n{where}"


@agent.tool
def shop_overview(ctx: RunContext[ShopDeps]) -> ShopOverview:
    """What Campus Customs carries: product count, categories with counts, price range, and sizes."""
    ctx.deps.tools_used.append("shop_overview")
    return tools.shop_overview()


@agent.tool
def get_product_info(ctx: RunContext[ShopDeps], product: str) -> ProductInfoResult:
    """Look up one product's description, colors, and price from the database.

    product: the product name as the shopper said it (e.g. "big yale hoodie",
    "Branford quarter-zip") or an exact product_id. If status is "ambiguous",
    ask the shopper which candidate they mean; if "not_found", don't guess.
    """
    ctx.deps.tools_used.append("get_product_info")
    result = tools.get_product_info(product)
    ctx.deps.seen_ids.update([result.product.product_id] if result.product else [])
    ctx.deps.seen_ids.update(c.product_id for c in result.candidates)
    return result


@agent.tool
def check_stock(ctx: RunContext[ShopDeps], product: str, size: str | None = None) -> StockResult:
    """Look up how many units are in stock for one product, by size, from the inventory table.

    product: product name or product_id. size: optional, e.g. "M", "medium",
    "XL", "2XL". requested_size_quantity == 0 means that size is SOLD OUT.
    """
    ctx.deps.tools_used.append("check_stock")
    result = tools.check_stock(product, size)
    ctx.deps.seen_ids.update([result.product_id] if result.product_id else [])
    ctx.deps.seen_ids.update(c.product_id for c in result.candidates)
    return result


@agent.tool
def search_catalogue(
    ctx: RunContext[ShopDeps],
    query: str = "",
    category: str | None = None,
    color: str | None = None,
    max_price: float | None = None,
    size_in_stock: str | None = None,
) -> SearchResult:
    """Search the catalogue when the shopper wants to see or browse a type of item.

    query: shopper's words, e.g. "hockey", "bulldog", "Saybrook", "grandpa".
    category: one of hoodie, T-shirt, crewneck sweatshirt, quarter-zip, jacket,
      long-sleeve shirt, mockneck sweatshirt.
    color: e.g. "gray", "navy", "white". max_price: in dollars.
    size_in_stock: only items with this size in stock, e.g. "M".
    Put the product_ids you want shown in your answer's product_ids.
    """
    ctx.deps.tools_used.append("search_catalogue")
    result = tools.search_catalogue(query, category, color, max_price, size_in_stock)
    ctx.deps.seen_ids.update(h.product_id for h in result.results)
    ctx.deps.last_search_ids = [h.product_id for h in result.results]
    return result


@agent.tool
def find_alternatives(ctx: RunContext[ShopDeps], product: str, size: str) -> AlternativesResult:
    """When an item is sold out (or low) in the shopper's size, find similar items that ARE in stock in that size.

    product: product name or product_id. size: e.g. "M", "large", "2XL".
    Same-category items with a similar look come first. Put the ones you
    recommend in product_ids so they show as cards.
    """
    ctx.deps.tools_used.append("find_alternatives")
    result = tools.find_alternatives(product, size)
    ctx.deps.seen_ids.update(a.product_id for a in result.alternatives)
    ctx.deps.seen_ids.update([result.product_id] if result.product_id else [])
    return result


def _history(turns: list[ChatTurn]) -> list[ModelMessage]:
    """Turn the chat so far into PydanticAI messages so the agent remembers it."""
    out: list[ModelMessage] = []
    for t in turns[-MAX_HISTORY:]:
        text = t.text.strip()
        if not text:
            continue
        if t.role == "user":
            out.append(ModelRequest(parts=[UserPromptPart(content=text)]))
        else:
            out.append(ModelResponse(parts=[TextPart(content=text)]))
    return out


async def run_chat(
    message: str,
    history: list[ChatTurn] | None = None,
    customer: Customer | None = None,
    page: PageContext | None = None,
    who: str = "guest",
) -> ChatReply:
    """Answer one chat message from the website, and record it in the audit trail."""
    started = time.perf_counter()
    page_product = None
    if page and page.product_id:
        info = tools.get_product_info(page.product_id)
        page_product = info.product if info.status == "found" else None
    deps = ShopDeps(customer=customer, page=page, page_product=page_product)
    prompt = message
    if page_product:
        # Problem 11 testing found the agent reading "this" as an item from older
        # chat history. Tagging the newest message with the page fixes that.
        prompt = f"{message}\n\n[Shopper is currently viewing: {page_product.name} (product_id: {page_product.product_id})]"

    entry: dict = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "who": who,
        "page": page.path if page else None,
        "message": audit.short(message, 300),
        "model": MODEL_NAME,
    }
    result = None
    try:
        result = await agent.run(
            prompt,
            deps=deps,
            message_history=_history(history or []),
            usage_limits=UsageLimits(
                request_limit=MAX_REQUESTS, tool_calls_limit=MAX_TOOL_CALLS, total_tokens_limit=MAX_TOTAL_TOKENS
            ),
            model_settings=MODEL_SETTINGS,
        )
        answer: ShopAnswer = result.output
        entry["stop_reason"] = "final_answer"
    except UsageLimitExceeded as exc:
        log.warning("Agent hit a loop limit: %s", exc)
        answer = ShopAnswer(reply="Sorry, that one got a bit tangled on my end. Could you ask it a simpler way?")
        entry["stop_reason"] = f"loop_limit: {audit.short(str(exc), 160)}"
    except Exception as exc:
        if "content_filter" in str(exc):
            # The AI provider's own safety filter refused the message (e.g. a jailbreak attempt).
            log.warning("Provider content filter blocked a message")
            answer = ShopAnswer(reply="I can't help with that one. I'm happy to help you find Yale gear, check sizes, or look up stock, though!")
            entry["stop_reason"] = "blocked_by_provider_filter"
        else:
            # Details go to the server log only; the shopper gets a friendly message.
            log.exception("Agent run failed")
            answer = ShopAnswer(reply="Sorry, I hit a snag answering that. Please try again in a moment.")
            entry["stop_reason"] = f"error: {type(exc).__name__}"

    # Only ids a tool actually returned this turn become cards, so the model
    # can't put a made-up product on the page. Card details come from the DB.
    wanted = answer.product_ids or (deps.last_search_ids if answer.show_search_results else [])
    shown = [pid for pid in wanted if pid in deps.seen_ids]
    dropped = [pid for pid in wanted if pid not in deps.seen_ids]

    # Price honesty (Problem 12): every $ amount in the reply must come from a tool this turn.
    new_msgs = result.new_messages() if result else []
    allowed = {round(page_product.price, 2)} if page_product else set()
    for m in new_msgs:
        if isinstance(m, ModelRequest):
            for part in m.parts:
                if isinstance(part, ToolReturnPart):
                    allowed |= audit.prices_in(part.content)
    reply, flags = safety.check_reply(answer.reply, allowed)
    if dropped:
        flags.append(f"dropped_unverified_ids:{len(dropped)}")
    if flags:
        log.warning("Safety flags: %s", flags)

    usage = result.usage if result else None
    entry.update({
        "steps": audit.tool_steps(new_msgs),
        "model_calls": usage.requests if usage else 0,
        "tokens": {"input": usage.input_tokens, "output": usage.output_tokens} if usage else None,
        "reply": audit.short(reply, 300),
        "cards_shown": len(shown),
        "safety_flags": flags,
        "ms": round((time.perf_counter() - started) * 1000),
    })
    try:
        audit.append(entry)
    except Exception:
        log.exception("Could not write audit trail")

    return ChatReply(
        reply=reply,
        products=tools.product_cards(shown),
        tools_used=list(dict.fromkeys(deps.tools_used)),
    )
