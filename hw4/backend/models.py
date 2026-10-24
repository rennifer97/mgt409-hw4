"""Pydantic / PydanticAI types for the Campus Customs chatbot.

Same idea as Homework 3: models.py is where the structured data lives.
Problem 5 starts with chat messages, product cards, and a shop overview.
Problems 6–8 add stock lookups, search results, and customer context.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# --- Chat (website <-> FastAPI) ---------------------------------------------

class ChatTurn(BaseModel):
    """One earlier message in the conversation, sent back so follow-ups make sense."""
    role: Literal["user", "assistant"]
    text: str = Field(max_length=4000)


class PageContext(BaseModel):
    """Where the shopper is on the site when they send a message (Problem 8)."""
    path: str = Field(default="/", max_length=200)
    product_id: str | None = Field(default=None, max_length=120, description="Set on /products/<id> pages")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Guests send their in-browser history. Logged-in users' history is loaded
    # from the database instead, so this is ignored for them.
    history: list[ChatTurn] = Field(default_factory=list, max_length=40)
    page: PageContext | None = None


class ProductCard(BaseModel):
    """What the chat widget needs to draw a product card (used from Problem 7)."""
    product_id: str
    name: str
    price: float
    image_url: str
    short_description: str


class ChatReply(BaseModel):
    """What /api/chat returns to the website."""
    reply: str
    products: list[ProductCard] = Field(default_factory=list)
    tools_used: list[str] = Field(default_factory=list)


# --- Tool results -----------------------------------------------------------

class CategoryCount(BaseModel):
    category: str = Field(description="Simple shopper-facing group, e.g. 'hoodie' or 'T-shirt'")
    count: int


class ShopOverview(BaseModel):
    """High-level facts about what the shop sells, read from the database."""
    total_products: int
    categories: list[CategoryCount]
    min_price: float
    max_price: float
    sizes: list[str]


# --- Product info and stock lookups (Problem 6) -----------------------------

LookupStatus = Literal["found", "ambiguous", "not_found"]


class ProductMatch(BaseModel):
    """A possible product when the shopper's wording fits more than one item."""
    product_id: str
    name: str
    price: float


class ProductInfo(BaseModel):
    """Catalogue facts for one product, straight from the database."""
    product_id: str
    name: str
    category: str = Field(description="Simple group, e.g. 'hoodie'")
    garment_type: str = Field(description="Exact label from the catalogue")
    description: str
    colors: list[str]
    price: float = Field(description="US dollars, from the catalogue")


class ProductInfoResult(BaseModel):
    status: LookupStatus
    product: ProductInfo | None = None
    candidates: list[ProductMatch] = Field(default_factory=list)
    note: str = Field(description="Plain-language hint for the agent about what to say next")


class SizeStock(BaseModel):
    size: str
    quantity: int
    in_stock: bool


class StockResult(BaseModel):
    """Stock for one product, by size, straight from the inventory table."""
    status: LookupStatus
    product_id: str | None = None
    name: str | None = None
    price: float | None = None
    requested_size: str | None = Field(default=None, description="Normalized size the shopper asked about, if any")
    requested_size_quantity: int | None = Field(default=None, description="Units of the requested size; 0 means sold out")
    sizes: list[SizeStock] = Field(default_factory=list)
    available_sizes: list[str] = Field(default_factory=list)
    sold_out_sizes: list[str] = Field(default_factory=list)
    total_in_stock: int = 0
    candidates: list[ProductMatch] = Field(default_factory=list)
    note: str


# --- Catalogue search -> product cards (Problem 7) --------------------------

class SearchHit(BaseModel):
    """One search match, compact so a 27-item result stays small for the model.
    (Problem 9: colors dropped to save tokens; get_product_info has them.)"""
    product_id: str
    name: str
    category: str
    price: float
    in_stock_sizes: list[str]


class SearchResult(BaseModel):
    total_matches: int
    results: list[SearchHit] = Field(description="Best matches first, capped at 30")
    note: str


class ShopAnswer(BaseModel):
    """The agent's structured final answer (its output_type).

    reply: the chat text. show_search_results / product_ids: which products to
    show as cards on the page, taken from tool results this turn. The backend
    drops any id a tool didn't return, then builds the cards from the database.
    """
    reply: str = Field(description="Short, friendly chat reply in plain text")
    show_search_results: bool = Field(
        default=False,
        description="True to show ALL results of your latest search_catalogue call as cards. "
        "Cheaper and faster than listing their ids.",
    )
    product_ids: list[str] = Field(
        default_factory=list,
        description="Specific product_id values to show as cards (e.g. a few alternatives). "
        "Leave empty for simple price/stock answers or when nothing matched.",
    )


# --- Customer memory (Problem 8) --------------------------------------------

class Customer(BaseModel):
    """What the agent knows about a logged-in shopper. No id, password, or hash."""
    first_name: str
    last_name: str
    email: str


class SavedMessage(BaseModel):
    """One stored chat message, sent back to redraw the chat when a customer returns."""
    id: int
    role: Literal["user", "assistant"]
    text: str
    created_at: str
    products: list[ProductCard] = Field(default_factory=list)


# --- Sold-out alternatives (Problem 9) ---------------------------------------

class Alternative(BaseModel):
    product_id: str
    name: str
    category: str
    price: float
    quantity_in_size: int = Field(description="Units in stock in the requested size")
    same_category: bool


class AlternativesResult(BaseModel):
    status: LookupStatus
    product_id: str | None = None
    name: str | None = None
    size: str
    original_quantity: int = Field(default=0, description="Stock of the original item in that size (0 = sold out)")
    alternatives: list[Alternative] = Field(default_factory=list)
    candidates: list[ProductMatch] = Field(default_factory=list)
    note: str


class WelcomeBack(BaseModel):
    """Problem 9: greeting for a returning customer, built from their saved chat."""
    text: str
    topic: str = Field(default="", description="The question that led to the last product cards")
    products: list[ProductCard] = Field(default_factory=list)


# --- Bag and abandoned-bag nudges --------------------------------------------

class AddToBagRequest(BaseModel):
    product_id: str = Field(max_length=120)
    size: str = Field(max_length=10)
    quantity: int = Field(default=1, ge=1, le=10)


class BagItem(BaseModel):
    """One line in a shopper's bag, priced and stock-checked live from the catalogue."""
    id: int
    product_id: str
    name: str
    size: str
    quantity: int
    price: float
    image_url: str
    in_stock: int = Field(description="Units left in this size right now")
    available: bool = Field(description="False if stock dropped below the bag quantity")


class BagView(BaseModel):
    items: list[BagItem]
    count: int
    subtotal: float
    reminders_on: bool = Field(description="Whether 'you left this behind' emails are on")
