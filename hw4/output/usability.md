# Usability Improvements (Problem 9)

Four improvements: two on the front end (what shoppers see and use) and two
in the agent/backend (better answers, faster and cheaper). All four run in the
app. Each section says what we added, why it helps a Campus Customs shopper
or the business, and where to see it.

We also made two smaller fixes along the way (listed at the end): a friendlier
chatbot voice, and real colors and descriptions for 3 products that had
placeholder data.

---

## Front end 1: Screen-reader friendly and accessible site

**What we added**

- **Skip link:** the first Tab on any page shows "Skip to main content", so
  keyboard and screen-reader users don't have to tab through the whole nav every time.
- **Page titles and focus on navigation:** every page sets its own tab title
  ("Crew Left Chest Hoodie · Campus Customs", "Log in · Campus Customs").
  After following a link, focus moves to the new page's content instead of
  staying on the old link, so screen readers start reading the new page.
- **Chat that talks:** the message list is a live region (`role="log"`,
  `aria-live="polite"`), so each new reply is read aloud. Each bubble is
  labeled "You said:" or "Assistant:", and there's a hidden "Assistant is
  typing" cue. The panel is a labeled dialog. Opening it puts the cursor in the
  message box, and **Esc** closes it and returns focus to the chat button. An
  automatic welcome-back open does *not* steal focus.
- **Chat results announced:** when the chat puts products on the page, a
  status message reads "27 products from your chat are now shown on the
  Products page." Focus stays in the chat so the shopper can keep typing.
- **Clearer product info for screen readers:** each size reads as "Size M:
  sold out" or "Size L: 8 left" (not just crossed-out text). The product
  photo is described ("Crew Left Chest Hoodie, product photo"). On cards the
  photo is marked decorative so the name isn't read twice.
- **Forms:** login and sign-up errors are linked to the fields
  (`aria-describedby`, `aria-invalid`) and announced right away. The password
  rule ("at least 8 characters") is read with the password field.
- **Seeing it:** a bold focus ring on every link, button, and field (gold on
  navy areas). The light-blue accent text was darkened to pass 4.5:1 contrast
  on white and cream. Animations and smooth scrolling turn off when the
  shopper's device asks for reduced motion.
- **Headings and landmarks:** one main nav labeled "Main", one banner, one
  main, footer labeled, headings in order (H1 → H2 → H3) on every page.

**Why it helps**

About 1 in 4 U.S. adults has a disability. A store that can't be used with a
keyboard or screen reader turns those customers away, along with parents and
grandparents shopping for Yale gifts with poor vision. Accessible sites also
lower the risk of legal complaints and work better for everyone: clear focus,
readable contrast, and announced errors make checkout smoother.

**Proof**

Automated audit with **axe-core 4.10** (WCAG 2 A, AA, and best-practice
rules), run on Home, Products, a product page, About Us, Log in, and Create
account, **with the chat panel open**:

| Page | Before fixes | After |
|---|---|---|
| All 6 pages | 2 issues each (duplicate "banner" landmark from the chat header); Products also had a skipped heading level | **0 violations** on every page (46–47 checks passed per page) |

Keyboard test in the running app: Tab → "Skip to main content" → Enter moves
focus to the content. A link moves focus to the new page and updates the
title. Enter on "Chat with us" puts the cursor in the message box. Esc closes
the chat and returns focus to the button.

**Where to see it:** press Tab on any page, open the chat with the keyboard,
or turn on VoiceOver (Cmd+F5 on a Mac).

---

## Front end 2: "Welcome back, pick up where you left off"

**What we added**

When a logged-in customer comes back, the chat greets them by name and brings
back what they were last looking at, with the actual product:

> Hey Test, welcome back! Last time you were checking out the Baseball Left
> Chest Crewneck. Want to pick up where you left off?
> [photo · Baseball Left Chest Crewneck · $58.00]

- New endpoint `GET /api/chat/welcome` (`memory.welcome_back()`) finds the
  customer's most recent reply that showed products (or the product page they
  were asking about) and the question behind it.
- The chat shows a welcome bubble with up to 3 small clickable product cards
  (photo, name, price) that open the product page, plus "Show all N again →"
  when there were more.
- It opens the chat automatically **once per visit** so returning customers
  see it, without stealing keyboard focus.
- The backend now also remembers the product when a logged-in shopper asks
  about "this" on a product page, so "welcome back" can bring that item back too.
- Built from saved rows with **no AI call**, so it appears instantly and costs nothing.

**Why it helps**

Returning shoppers rarely buy on the first visit. Reminding them of the exact
item they were considering, by name and with the photo, cuts the "where was
that hoodie?" search and brings people back toward checkout. That's the same
idea as a real store clerk saying "Back for that crewneck?" It makes saved
accounts feel worth having, which helps the business keep customers.

**Where to see it:** log in as `test@campuscustoms.yale.edu` / `password` (or
reload while logged in in a new browser tab). The chat opens with the
welcome-back message and product card.

---

## Agent/backend 1: Sold-out? Here's what's in your size (`find_alternatives`)

**What we added**

- New agent tool **`find_alternatives(product, size)`** in `tools.py`. Given a
  product and size, it returns up to 6 other items that **have that size in
  stock**. Same category comes first (hoodie → hoodies), then items with the
  most similar look (shared words in name, tags, and colors), then closest price.
- `check_stock` was already clear about "sold out". The prompt now tells the
  agent: when a size is sold out, also call `find_alternatives` and show 2–3
  picks as product cards.
- Returns `AlternativesResult` (`models.py`): the original item's quantity in
  that size, plus each alternative's name, price, category, and units left in
  that size. The agent can't recommend something that's also sold out.

**Why it helps**

Before, "sorry, M is sold out" was a dead end, and the shopper often left.
Now the answer is "M is sold out, but these 3 left-chest hoodies have M," with
cards to click. Shoppers find something that fits, and the shop saves a sale
it would have lost. The agent only suggests items it has checked are in stock,
so it stays accurate.

**Proof (running app):** on the Crew Left Chest Hoodie page, asked "Do you
have this in medium?"

> The Crew Left Chest Hoodie is sold out in M. It's available in XS, S, L, XL,
> and XXL. Similar hoodies in M include the Fencing Left Chest Hoodie, Sailing
> Left Chest Hoodie, and Squash Left Chest Hoodie. I've put them here for you to browse.

The Products page showed those 3 cards. The database confirms M stock of 15, 25, and 5.

---

## Agent/backend 2: Faster and cheaper agent

**What we added**

1. **In-memory catalogue cache** (`tools.py`): the catalogue and inventory are
   read from SQLite once and kept in memory. They're re-read automatically
   when the database file changes, so stock is never stale. The website's
   product pages use the same cache.
2. **"Show all results" switch:** instead of the model typing out up to 30
   product ids for a search (slow, costly output tokens), it sets
   `show_search_results: true` and the backend uses the ids from its own
   search. Search results sent to the model also dropped the colors field (the
   agent can still look colors up).
3. **Low reasoning effort** (`MODEL_SETTINGS = {"openai_reasoning_effort": "low"}`):
   our tools do the lookups, so the model needs little hidden "thinking" per step.
4. **Cache-friendly prompt:** the fixed system prompt comes first and the
   per-shopper note comes last, so the AI provider can reuse the fixed part.
   We measured about **95% of input tokens served from the prompt cache**
   (cached tokens are billed at a fraction of the normal rate). We also removed
   two tools that only repeated what the per-shopper note already says
   (`get_customer_profile`, `get_current_page_product`), which shrinks every request.

**Why it helps**

Shoppers get answers sooner (a slow chat feels broken), and the shop pays less
per conversation as traffic grows. The cache also makes the product pages load
faster.

**Proof: `backend/benchmark.py`** asks the same 4 questions 3 times each,
skipping the gateway's response cache, and keeps the median time. Raw results
are in `output/benchmark.json`.

| Question | Before: time / output tokens | After: time / output tokens |
|---|---|---|
| What hoodies do you have? | 5.09 s / 351 | **3.45 s / 87** |
| How much is the Yale Dad T Shirt? | 3.47 s / 54 | **2.80 s / 51** |
| Show me gray t-shirts under $40 | 4.58 s / 249 | **2.79 s / 97** |
| Crew Left Chest Hoodie in medium? (sold out) | 4.18 s / 74 | 5.75 s / 156 *(on purpose: now also finds alternatives, see Agent 1)* |

- On the three questions that do the same job as before: **31% faster** (4.38 s → 3.01 s
  average) and **64% fewer output tokens** (218 → 78 average).
- Database tool calls: `check_stock` 0.34 ms → 0.011 ms, `get_product_info`
  0.19 ms → 0.010 ms, `search_catalogue` 0.62 ms → 0.15 ms per call (20–30× faster).
- Honest note: total input tokens per question went up (about 4,840 → 6,000)
  because the prompt and tools now cover more (alternatives, friendlier voice).
  About 95% of that input is served from the prompt cache, leaving only about
  250 uncached input tokens on a normal question.

---

## Smaller fixes made alongside

**Friendlier chatbot voice** (`prompts/prompt.md`, "Voice"): the agent now
talks like a friend who works at the shop. It's warm and relaxed, uses
contractions, uses the shopper's first name now and then, reacts to what they
said, and ends with an easy follow-up. Bad news is delivered kindly and is
followed straight away by alternatives. Example: "Ooh, a hockey-loving dad is easy
to shop for! I found 8 options…"

**Three placeholder products fixed:** `benjamin-franklin-t-shirt`,
`berkeley-sweater-fleece-jacket`, and `timothy-dwight-college-crewneck` had
"Vision blocked; filename-based stub" descriptions and no colors. We read the
colors from their photos and added them in `tools.py` (`CATALOGUE_FIXES`),
applied when the catalogue loads. The graders' own copy of the database gets
the fix too.

| Product | Colors (from the photo) |
|---|---|
| Benjamin Franklin T Shirt | heather gray; crest in blue, red, white; black lettering |
| Berkeley Sweater Fleece Jacket | heather gray with dark gray zipper and trim; red and white crest |
| Timothy Dwight College Crewneck | heather gray; small red and white crest; black lettering |

Result: their product pages show real descriptions and colors, the agent can
answer color questions about them, and "gray T-shirts under $40" now finds 18
instead of 17 (the Benjamin Franklin tee was missing before).
