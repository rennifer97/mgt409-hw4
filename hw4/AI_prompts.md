# AI Prompt Log — Homework 4

This file records what was typed into the vibe coder (Claude Code) while
completing Homework 4, and what Claude did in response. Each problem has its
own section with the problem number and title, the prompt in my own words, and
any follow-up prompts (with one sentence on what the first prompt was missing).

All code and JSON files Claude creates are kept in this folder as evidence of
the work.

---

## Setup

### Initial prompt

All right, let's work on AI Foundations homework for please start the setup folder the way we have previously so we can begin.

### Claude's response

Set up `Week 4 Homework` the same way as Homework 3: `data/`, `output/`, and
`prompts/` folders, `.env.example` (variable name only), `.gitignore` (keeps
`.env` and `.venv` out of git), `requirements.txt`, a `.venv`, and this prompt log.

### Follow-up prompts

"Great, what do I need to do to get started?" / "its homework 4"

What was lacking: the first prompt didn't name the homework, so Claude didn't
know which assignment's layout to follow.

Claude read the Homework 4 pages and changed the setup to match the required
submission layout: everything now lives in `Week 4 Homework/hw4/`, with
`frontend/`, `backend/prompts/`, `data/`, and `output/` folders. The log was
renamed to `AI_prompts.md`. `.gitignore` now also leaves out the database,
product images, and `node_modules`, and FastAPI and Uvicorn were added to
`requirements.txt`.

"here is the zip" (attached `data.zip`)

Claude unzipped the data pack into `hw4/data/`: `campus_customs.db` and
`products/` with 102 product photos. Both stay out of git through `.gitignore`.

---

## Problem 1: Vibe Coder Prompts

### Initial prompt

Okay, so starting with problem one, we need to title that the Vibe Coder prompts. And for that, we need to create the AI prompts.md, which I think you already did, please confirm. And then keep that updated as we work. We're going to talk about each problem and work on it together. There's going to be one section for each problem. So each section has to include the number and the title, as we have done before, at least one prompt that I put in. So please keep a log of our conversation exactly as we have it. And then a follow-up prompt if needed, with any information about, you know, why the follow-up was needed. The running site, the database writes, and screenshots are the evidence. And I don't need any extra proof essay beyond the prompts. So that's all for problem one. Are we all set there?

### Claude's response

Confirmed that `hw4/AI_prompts.md` already exists (created during setup) and
added this Problem 1 section. From here on, each problem gets its own section
with the problem number and title, Ren's prompts copied word for word, Claude's
response, and any follow-up prompts with one sentence on what the first prompt
was missing. No separate proof essay; the running site, database writes, and
screenshots are the evidence.

### Follow-up prompts

None needed. The first prompt covered everything for this problem.

---

## Problem 2: Analyze the Database

### Initial prompt

Great. Now, moving on to problem two, the title is Analyze the Database. So please look at the database titled data/campus_customs.db, which should be in that zip file, I think, and check through the fields of each table. So we need to understand the catalog, inventory, and the users at minimum. And then start the file output/harness.md and write down each table and its fields, and then one short line on why each field matters for the shop or for the chatbot. And we're going to keep growing this harness file in later problems, like, and that would include models, tools, safety, specs, etc.

### Claude's response

Read the schema and sample rows of every table in `data/campus_customs.db`:
`catalogue` (102 products), `inventory` (612 rows, 6 sizes per product),
`users` (3 accounts), and `chat_messages` (22 saved messages). Checked that all
102 product images exist. Started `output/harness.md` with a section for each
table that lists every field, its type, and one line on why it matters for the
shop or chatbot. Also noted two things later problems need to handle:
`garment_type` labels vary, and 145 size rows are out of stock.

### Follow-up prompts

Should we then have t-shirt and t-shirt be consistent with their spelling and capitalization? And then for the hoodies, the thing is, a hoodie can also be a zip up or a pullover. So maybe just classify them all as hoodies. And then I guess if we could probably wait for the next prompts, because I'm sure that that data will come up as relevant and we can fix it then.

What was lacking: the first prompt only asked us to describe the data, not
what to do about the messy category labels.

Claude's response: agreed to group them, but in the code rather than by editing
the database, because graders will use their own copy of the data pack and
edits to our copy wouldn't reach them. Found 27 hooded items under 5 labels
(including full-zip) and 25 T-shirts under 5 labels. Plan for Problems 6–7: the
search tool will put each item into a simple group (hoodie, T-shirt, crewneck,
quarter-zip, jacket, long-sleeve shirt). The original `garment_type` stays on
the detail page.

---

## Problem 3: Build the Campus Customs Website

### Initial prompt

Okay, sounds good. Let's move on to problem three titled Build the Campus Customs Website. So for this, we need to scaffold a React plus Vite plus TypeScript front end for campus customs. Put a nav bar, so like a navigation bar at the top that links to the main pages, which are home, products, about us, log in, and create account. Pull the campus customs style wording from yalebulldogblue.com for home and about us, but write these pages in our own voice. On the products page, we need to show product images from the catalog. So use the image paths in the database with product information. So the name, price, and short description. Make each product open a single item page. So large image on one side, full product text on the other, including the description, price, sizes, stock, when we have them. And then clicking a card on product should take the shopper there. We need to add a chat interface in the bottom right of the site. So a floating chat panel of some sort. It does not need to talk to an agent yet. A stub that will call your backend later is enough for this one. And then we'll need a small API soon to read the database. So they say it's fine to start a simple, fast API app in backend/main.py just to serve products and images. And then we're going to grow it into the agent backend in problem 5.

### Claude's response

- Read yalebulldogblue.com for the shop's tone (upbeat Bulldog pride, officially
  licensed, 57 Broadway in New Haven) and wrote Home and About Us in our own words.
- Scaffolded `frontend/` with Vite's React + TypeScript template and added React
  Router. Pages: Home, Products, single-item page, About Us, Log in, Create
  account. Nav bar on top, footer, and a floating "Chat with us" panel bottom-right.
- Products page shows all 102 products as cards (image from `image_file_path`,
  name, price, two-line description). Clicking a card opens `/products/<id>`
  with a large image on the left and name, type, price, description, colors, and
  stock for each size on the right. Sold-out sizes are crossed out.
- `backend/main.py` (FastAPI): `/api/products`, `/api/products/{id}` (with stock
  per size), a `/api/chat` stub, and `/media/products/` for photos. Only the
  photo folder is public, not the database.
- Log in and Create account have their form fields but don't save yet (Problem 4).
- Tested in the browser: all pages load, cards open the right item page, chat
  sends a message and gets the stub reply, no console errors. Added section 2
  to `output/harness.md`.

### Follow-up prompts

None needed. The first prompt covered everything for this problem.

---

## Problem 4: Create Account and Login

### Initial prompt

It's looking good. On my end, so let's move on. Problem 4 is titled Create Account and Login. So first we're going to build a normal create account /login flow. Which includes create account, that should have the details, first name, last name, email, password, and then confirm the password as well. So we need those two boxes, and then they need to log in. So typing in the email and password. New accounts go into the users table. And make sure we store password securely so that the hackers can't access them, whether they're human or AI. I think you already started doing that, like hashing them so that's good. Please just keep confirming with me that they are private. The seed database already has a test user you can use while building this. So the email is test@campuscustoms.yale.edu. The password should be password with no capital letters. And then the hash function it has written here as all uppercase letters, PBKDF2-HMAC-SHA256. Now, 120,000 iterations. Stored as a salted hash password, which is lowercase PBKDF2_SHA256$SALT$HASH. So how the login checks a password . So we never run unhash the stored value. You rehash what the user typed in compare. Read the salt out of the stored string, so the middle piece, and don't make a new one at login. Hash the typed password with the same salt, then compare to the stored hash. Use a constant time compare. Sign up and login must use the same hash settings. So the same function, same salt handling, same iteration count. If they differ, even the right password won't match. So the surest check is to log in, as the seeded user and as a brand new account we just created. So let's see if I can log in as that user and then a brand new account that we create. Then I want you to update the output/harness.md with how authorization works. So what we store for a user and how passwords are protected.

### Claude's response

- First checked the seed format: re-hashing `password` with the test user's
  stored salt and 120,000 iterations matches the stored hash.
- `backend/auth.py`: `hash_password` (new random salt at sign-up),
  `verify_password` (reads the stored salt, re-hashes, `hmac.compare_digest`),
  and signed login tokens using a `SESSION_SECRET` in `.env`.
- `backend/main.py`: `POST /api/auth/signup`, `POST /api/auth/login`,
  `GET /api/auth/me`. Replies never include the password hash. Wrong email
  and wrong password get the same message and take the same time.
- Frontend: Create account (first, last, email, password, confirm) and Log in
  forms now work. The nav shows "Hi, <first name>" and Log out when logged in.
- Tested: the seed user logs in and a wrong password is rejected. A new
  account (Handsome Dan) was created, stored as row 4 with its own salt, then
  logged out and logged back in. The plain password is not in the database.
  Forged or edited tokens are rejected.
- Added section 3 to `output/harness.md`.

### Follow-up prompts

Can you show me again in the panel that it works? Just one more time.

What was lacking: the first round was tested behind the scenes, and Ren wanted
to watch the login happen live.

Claude's response: logged out, then logged in live in the browser panel as
`test@campuscustoms.yale.edu`. The site went to Products and the nav showed
"Hi, Test" and "Log out".

---

## Problem 5: PydanticAI Agent Backend

### Initial prompt

Okay, for problem five, it's going to be titled Pydantic AI Agent Backend. So now we are going to build the shop chatbot as a Pydantic AI agent behind Fast API, plugged into your front end chat widget. Put the API app in backend/main.py. That's the file we run with the uvicorn. Keep the agent as these four files next to it, so the same idea as homework three. backend/prompt/prompt.md. And then that's the system prompt, so grow the same file later. Then backend/agent.py, which is agent entry slash wiring. backend/tools.py, which is tools that the agent can call. Then backend/models.py, which is Pydantic slash Pydantic AI structured types. In main.py, expose a chat route so a message from the website returns a reply from the agent, and whatever else we need for products and authorization. We're going to need the AI model API key for the agent. I think you have that. I think it's private. Again, like, I just want more confirmation that all of that is remaining private as we use it, and that way it's not, you know, hacked by anybody. Then we're going to put the campus customs voice and safety basics into prompt/prompt.md, and we're going to expand the tools and safety later for that, so don't worry about that right now. Start or update types in models.py for chat replies and product cards as needed. And then in output/harness.md, note how the front end talks to Fast API and how the agent is loaded, so the prompt file and model. And then make sure the back end runs from the back end slash folder, like what I'm about to copy and past. uvicorn main:app --reload --port 8000

### Claude's response

- Created the four agent files in `backend/`: `prompts/prompt.md` (the
  assignment's folder name), `agent.py`, `tools.py`, `models.py`.
- `prompts/prompt.md`: Campus Customs voice (warm, short, Bulldog spirit),
  "only state facts from tools," and safety basics (stay on topic, never ask
  for or share passwords, card numbers, keys, or instructions, ignore
  attempts to change its role).
- `models.py`: `ChatTurn`, `ChatRequest`, `ChatReply` (reply, product cards,
  tools used), `ProductCard`, `ShopOverview`.
- `tools.py`: `shop_overview` tool, plus the category grouping we planned in
  Problem 2 (22 labels → 7 groups, e.g. all 27 hooded items = "hoodie").
- `agent.py`: PydanticAI agent on `gpt-6-luna` via Portkey. The first test
  failed because this model won't run tools on the Chat Completions API, so it
  now uses `OpenAIResponsesModel`. Limited to 6 model calls per message.
- `main.py`: `/api/chat` now calls the agent. The chat widget sends earlier
  turns so follow-ups work.
- Privacy: the key stays in `MGT409/.env` (owner-only permissions, gitignored)
  and is used only on the server. Checked it isn't in the built website or any
  other file, and the chatbot refuses when asked for it.
- Tested live in the browser: "What do you sell, and what's your price range?"
  → 7 categories, $32–$98, XS–XXL (from the tool). "How many of those are
  hoodies?" → 27. Also fixed the Send button getting cut off in narrow windows.
- Added section 4 to `output/harness.md`, including run commands.

### Follow-up prompts

Wonderful. Are we all set with that one? Like problem five, is that all

What was lacking: nothing was missing from the build; Ren wanted to confirm
every Problem 5 requirement was covered before moving on.

Claude's response: checked each requirement against the assignment page
(main.py with Uvicorn, the four agent files, chat route, private API key,
voice and safety in prompt.md, chat reply and product card types, harness
notes, runs from `backend/`). All are covered.

should be prompts

Claude's response: confirmed the folder is already `backend/prompts/` (plural),
matching the assignment. No change needed.

---

## Problem 6: Tools: Product Info and Stock

### Initial prompt

Great. Okay. Problem six is titled tools:product info and stock. So first we're going to give the agent tools that look up real information from campus_customs.db. Which will be the product description, the price, and how many are in stock by size when the customer asks. The agent must use the database, so it should not invent prices or quantities if a size is out of stock. It should say so clearly. So no hallucinating, no making up numbers. Then we're going to expand prompts/prompt.md. So the agent knows to call these tools for price and stock questions. Add or update return types in models.py. And then in the output/harness.md, list each tool and explain why explain which model fields you chose for lookup results and why.

### Claude's response

- `tools.py`: added `get_product_info(product)` (description, colors, price)
  and `check_stock(product, size)` (units per size, in-stock and sold-out
  lists). Both share a name matcher that understands shopper wording
  ("quarter zip", "tee", "medium", "2XL") and returns found / ambiguous /
  not_found, so the agent asks or admits it can't find an item instead of
  guessing. Weak matches ("pink unicorn sweater") count as not found.
- `models.py`: `ProductInfo`, `ProductInfoResult`, `ProductMatch`, `SizeStock`,
  `StockResult`.
- `agent.py`: registered both tools with docstrings explaining when to use them.
- `prompts/prompt.md`: question-to-tool table and rules: always call a tool
  before any price or quantity, never estimate, say "sold out" clearly and
  offer in-stock sizes, ask on ambiguous, don't guess on not found.
- Tested 8 questions through the chat and checked each answer against the
  database. All match, including sold-out sizes (Crew Left Chest Hoodie M, Ice
  Hockey hoodie L). Also tested live in the browser panel.
- Added section 5 to `output/harness.md`: each tool, and why each result field
  was chosen.

### Follow-up prompts

None needed. The first prompt covered everything for this problem.

---

## Problem 7: Chat Search That Updates the Page

### Initial prompt

Okay, great. Problem 7, should be titled chat search that updates the page. So we're going to add a feature to the site when a customer asks about a type of item, for example, like what kind of hoodies do you have, the agent should search the catalog and the website should dynamically show these matching items as product cards. Which should have the image, name, price, and short information. And then this is an API contract. The agent returns structured product matches, and then the front end renders them on the website. After the dynamic product cards are loaded by the new feature, make sure the same single item page behavior built in problem 3 still works. So each product card, including the ones the chat just put on the page, should still open that detail view with the large image and full information when it's clicked. Update the prompts /prompt.md and the output /harness.md so it's clear how search results reach the page.

### Claude's response

- `tools.py`: `search_catalogue(query, category, color, max_price,
  size_in_stock)` returns up to 30 compact matches. `product_cards(ids)`
  builds website cards from the database.
- `models.py`: `SearchHit`, `SearchResult`, and `ShopAnswer` (reply +
  product_ids), which is now the agent's structured output.
- `agent.py`: registered `search_catalogue`. Every product id a tool returns is
  recorded, and only those ids become cards, so the agent can't show a
  made-up product.
- Frontend: chat results are shared state. When a reply has products, the
  site goes to Products, which shows "From your chat · N matches" with the
  cards and a "Show all products" button. The chat bubble gets a "View N items
  on the page →" link. Product cards work for both catalogue and chat results
  and open the same detail page.
- Fixed while testing: opening a product from a scrolled grid kept the scroll
  position, so the detail page now starts at the top.
- `prompts/prompt.md`: added `search_catalogue` to the tool table and a
  "Showing products on the page" section.
- Tested: hoodies (27 cards), gray tees under $40 (17), hockey (5), price
  question (no cards), pink sweaters (none, honest answer). In the browser:
  chat card → detail page → Back keeps results → Show all → 102.
- Added section 6 to `output/harness.md`: the API contract and each step from
  question to cards.

### Follow-up prompts

None needed. The first prompt covered everything for this problem.

---

## Problem 8: Customer Memory

### Initial prompt

All right, let's move on to problem 8, titled Customer Memory. So when a shopper is logged in, we're going to save their chat history in the database in an appropriate table and reload it when they return. So this should be kept with the customers or the user's profile. The agent in the chatbot should know who is chatting, so use the name and the email. And put that in agent depths, or an equivalent clear pattern. Or whatever tools the agent can call. Also, pass enough page context that if someone is on a product page and asks, do you have this in pink? The agent knows which item they mean you can put the code into the agent context and then guests can still chat if you're on the site and you don't have a login, but the history only needs to persist for 2 people who are logged in. Document in output/harness.md how user chat history is stored, what customer fields the agency sees, and how page context is passed.

### Claude's response

- History uses the seed's `chat_messages` table, linked to `users.id`. New
  `backend/memory.py` saves each message and reply, loads the last 12 for the
  agent's memory, reloads the last 60 for the chat panel, and can clear a
  customer's own history.
- `main.py`: `/api/chat` reads the login token. Logged in → agent gets the
  customer and database history, and both messages are saved. Guest → browser
  history, nothing saved. Added `GET` and `DELETE /api/chat/history`.
- `agent.py`: `ShopDeps` now carries `customer` (first name, last name, email)
  and `page` / `page_product`. A dynamic-instructions function tells the agent
  who is chatting and which product page they're on. New tools:
  `get_current_page_product`, `get_customer_profile`.
- Frontend: the chat sends the token and current page with each message,
  reloads saved chat on login ("Welcome back, Test!"), resets on logout, shows
  a saved/guest note with a Clear button, and shows **bold** properly.
- `prompts/prompt.md`: "Customer memory and page context" section.
- Found while testing: 3 seed products have placeholder descriptions and no
  colors. The tool now tells the agent to say colors weren't recorded, and the
  page shows "Not listed".
- Tested: "this in pink" and "this in medium" answered for the right product,
  identity questions for logged-in and guest users, recall of earlier chats,
  and in the browser: log out → guest → log in → history back, guest message
  not saved.
- Added section 7 to `output/harness.md`.

### Follow-up prompts

None needed. The first prompt covered everything for this problem.

---

## Problem 9: Usability Improvements

### Initial prompt

All right, problem 9 is titled Usability Improvements. So we need to improve it. So two front-end usability improvements and two agent and back-end usability improvements. Front-end improvements are things that make the site look better and make it easier to use. Agent and back-end improvements are things that make the agent output better, more accurate, or safer. These could be new agent tools or things that make the agent run faster or cheaper. Write output/usability.md before or as we build for each of the improvements. Say what we added, why it helps a campus customs shopper or the business. And then make sure all improvements actually show up in the running app. So the graders are going to read the write-up and look for these features. So I think what we just talked about, what you said, is that 3 products have placeholder descriptions and no colors listed. So can you please list those colors? If you can identify them and if you can't, show them to me and I will tell you what color they are. I would say one of the things that we could add is in the chat, when somebody logs back in, recall the history of what they were looking for previously and bring that back to them and say hi and address them by their name would you like to continue looking at whatever product they were looking at and list that actual product and I think that would improve enough. Maybe we could make the actual web interface look a little bit more sleek. So maybe as well the voice of the chatbot can be a little bit more personal. And talk to the person like it's a friend of theirs. Yeah, I think the design-wise for the site, it can be a little bit more dynamic. As just a website in general. And maybe one of the things for usability improvements, if you can make sure that the site itself is screen reader friendly and accessible. That would be super. And then can you name 2 agent or back-end usability improvements that we can

### Claude's response

Looked at the 3 product photos with missing data and identified their colors
(below). Proposed a plan for the four improvements and asked Ren to confirm
before building.

| Product | Colors seen in photo |
|---|---|
| Benjamin Franklin T Shirt | heather gray; crest in blue, red, and white; black lettering |
| Berkeley Sweater Fleece Jacket | heather gray with dark gray zipper and trim; red and white crest |
| Timothy Dwight College Crewneck | heather gray; small red and white crest on left chest; black lettering |

### Follow-up prompts

Answers to Claude's two questions (chosen from options Claude offered):
"Sold-out alternatives, Faster and cheaper" for the two agent/backend
improvements, and "Yes, save for Problem 10" for the sleeker design.

What was lacking: the first prompt asked Claude to name the agent/backend
improvements, so Ren needed to pick two before building. It also didn't say
whether the visual redesign belonged here or in Problem 10.

### Claude's response (after the follow-up)

- **Front end 1, accessibility:** skip link, page titles, focus moves to new
  pages, chat as a labeled dialog with live-read replies, Esc to close,
  "Assistant is typing" cue, size stock read as "Size M: sold out", linked
  form errors, focus rings, darker accent text for contrast, reduced-motion
  support. axe-core audit: 0 violations on all 6 pages with the chat open.
- **Front end 2, welcome back:** new `GET /api/chat/welcome`. Logged-in
  shoppers get "Hey Test, welcome back! Last time you were checking out the
  Baseball Left Chest Crewneck. Want to pick up where you left off?" with
  clickable product cards. The chat opens once per visit without stealing
  focus. Product-page questions now save that product so it can be recalled.
- **Agent/backend 1, sold-out alternatives:** new `find_alternatives` tool.
  "Do you have this in medium?" on a sold-out hoodie now offers 3 similar
  hoodies that have M, shown as cards.
- **Agent/backend 2, faster and cheaper:** in-memory catalogue cache,
  "show all search results" switch instead of listing ids, low reasoning
  effort, removed 2 duplicate tools, cache-friendly prompt order. New
  `backend/benchmark.py`: about 31% faster and 64% fewer output tokens on
  like-for-like questions, and tools 20–30× faster (`output/benchmark.json`).
- Also: friendlier "talk like a friend" voice in `prompt.md`, and real colors
  and descriptions for the 3 placeholder products (read from their photos,
  applied in code so graders get them too).
- Wrote `output/usability.md` (what, why, and proof for each) and added
  section 8 to `output/harness.md`.

Is everything all set? That seemed to take a very long time.

Claude's response: confirmed Problem 9 is complete and tested. The time went
into building four features and checking each one: the before/after speed
benchmark (dozens of real AI calls), the accessibility audit on 6 pages, and
live browser tests.

And is everything logged? Like, in the chat so that the graders can see what we added.

Claude's response: confirmed `AI_prompts.md` has a section for setup and for
Problems 1–9, each with Ren's prompts word for word, Claude's response, and
follow-ups. The features are written up in `output/harness.md` and
`output/usability.md`.

---

## Problem 10: Style the Website

### Initial prompt

Okay, problem 10 is titled style the website. So we are going to add creative design so the site feels like a real campus custom storefront with the fonts, color, hierarchy, motion, product presentation, chat feel. You'll get more points for imaginative and innovative design. And we are going to write output/design.md, which will have what we changed and why it should help customers stick around and buy. Keep it concrete and short. So I think for the design, I definitely want it to look more sleek. I would like to pull some images from Yale's student landing pages with like students wearing the gear that we're selling. And I'd like for this website to be targeted to incoming students to really show that they, you know, are excited about coming to Yale, that they're going to show their pride by wearing the Yale apparel, that it's finally, like, it's a big deal, like, it's for students. them, too. They're a part of this really great cohort of students. I would like you to look at maybe 10 different apparel websites, not other colleges so much, but maybe sites like Lululemon, Nike, Zara, H&M, things like that, and see how their sites are formatted, because I'd like to make it so that the campus customs feels like a real retailer rather than like just a retailer for a university apparel shop. Like, I want it to feel a little bit more elevated since it's an IV and probably a really big deal to these new students and their families and returning students and alumni. Like, it should feel as big as it is.

### Claude's response (research and photos)

- A research agent reviewed 10 apparel retailers (Nike, Everlane, and J.Crew
  read directly; Zara, H&M, Uniqlo, Lululemon, Aritzia, COS, and Patagonia
  through design write-ups). Shared patterns: full-bleed editorial photos, a
  neutral palette with one accent, small uppercase navigation, flat 4:5
  product cards, an announcement bar, curated collections, and white space.
- Claude flagged that Yale's own student photos are copyrighted and show real
  students, and that the repo will be public. It offered free-license photos,
  product photos only, linking to Yale's photos, or Ren's own photos.

### Follow-up prompts

(Choice from Claude's options) "Link to Yale's photos anyway"

What was lacking: the first prompt didn't say how to handle copyrighted Yale
photos on a public project.

Fine, use the free images, but they need to show like some of the Yale apparel.

What was lacking: the earlier choice used Yale's copyrighted photos. Ren
switched to free-license images and added that they must show Yale apparel.

### Claude's response (after the follow-ups)

- Searched Wikimedia Commons and Unsplash. Unsplash's free Yale photos were
  only buildings. Picked 4 Commons photos (CC BY-SA) that show Yale gear:
  football players in YALE jerseys (hero), cheerleaders at the Yale Bowl,
  the inflatable Handsome Dan with a YALE collar, and Harvard–Yale hockey at
  Ingalls. They're linked, not copied, and credited in the footer. Replaced
  Yale's crest images with typographic college monograms.
- Full redesign aimed at the Class of 2030: announcement bar; sticky header
  that shrinks on scroll; serif and sans font pairing; Yale blue as the only
  accent; hero "You made it. Now wear it."; scrolling motto band; category
  tiles; Welcome Collection carousel; "Find your college" monogram grid; Game
  Day and Yale Family stories; concierge section with question chips; new
  footer.
- Shop page: category tabs with counts, collection pills, search, sort, all
  saved in the URL. Product cards: 4:5 photos, badges, swatches, sizes on hover.
- Product page: breadcrumb, sticky buy panel, size grid with sold-out sizes
  crossed out, live stock note, "Ask the concierge about M", accordions, and
  "You might also like".
- Chat restyled as the Campus Customs Concierge (avatar, online status,
  suggestion chips, typing dots). Any page can open it with a question.
- About and account pages redesigned (split photo layouts).
- Fixed while checking: product photos with black or white backgrounds
  (now fill the tile), the college grid edge, About photo height, phone-width
  overflow (hidden screen-reader text escaping the carousel), and the logo
  wrapping on phones.
- Checked: 0 accessibility violations on 7 pages, no sideways scrolling at
  390 px, no console errors, and chat search, welcome back, and login still work.
- Wrote `output/design.md` (what changed and why, per area) and saved
  screenshots to `output/design_images/`. Added section 9 to `output/harness.md`.

---

## Problem 11: Site Testing (App Check)

### Initial prompt

love it. Okay, problem 11 is titled site testing. An app check. So we're going to test the live site and document it in output/apps_check.html a page we can double click open. Include clear screenshots and short captions. One, chat checking the inventory level of an item. Honest stock price from the database. Two, the dynamic search result cards appearing after a category question. For example, hoodies. And three, one of the usability features you added in problem 9. We're going to make the HTML easy to grade. Heading for each check a screenshot, one or two sentences on what the screenshot proves. Put the screenshot image files in output/app_check_images/. And link them from app_check.html with relative paths. For example, app_check_images/inventory.png.

### Claude's response

- Used `output/app_check.html`, the spelling on the assignment page.
- Installed Playwright in the project's environment (using the Mac's
  Chrome) and wrote `backend/app_check.py`. It tests the real running site
  like a shopper: types in the chat, clicks cards, logs in. It saves
  screenshots, reads the true stock from the database, and builds the HTML
  report with the chat's actual replies quoted.
- **Check 1, inventory:** on the Ice Hockey Left Chest Hoodie page, "How many
  of these do you have in small and in XXL?" got "8 in Small and 25 in XXL".
  The database shows S = 8 and XXL = 25, and the page's own stock note says
  "8 in stock in S".
- **Check 2, search cards:** "What hoodies do you have?" put 27 hoodie cards
  on the Products page (database: 27 hooded items). Extra screenshots show
  the full grid and that clicking a chat card opens the product page.
- **Check 3, usability (Problem 9):** logging in as the test user opened the
  chat with "Hey Test, welcome back! Last time you were looking at these…"
  and clickable product cards. Also included: sold-out alternatives
  (medium sold out, 3 hoodies that have M, with their M stock from the database).
- **Bug found by testing:** for a logged-in user with older chat history, the
  agent misread "this" on a product page as an item from the old
  conversation. Fixed (the current page now wins) and retested.
- First run issues fixed along the way: two buttons with similar names in
  the test script, quoted replies including button text, and asking about a
  sold-out size in check 1 sent the page to the alternatives.
- Added Playwright to `requirements.txt` (testing only) and section 10 to
  `output/harness.md`.

### Follow-up prompts

Can you show me in the panel here the screenshots so I can see?

What was lacking: the first prompt asked for the report file but not a
walkthrough of it in the app.

Claude's response: opened `app_check.html` in the browser panel, served by a
small local web server so the images load. All 6 screenshots load from
`app_check_images/`. Made each screenshot clickable to open full size, in the
report and in `app_check.py`.

---

## Problem 12: Audit Trail, Safety, Finish Harness

### Initial prompt

Okay, great. Now, problem problem 12 is going to be titled audit trail safety, finish harness. Keep an append-only output/audit_trail.json of agent loop activity, so time, tool name, short args, /result, stop reason, and do not wipe it between runs. Also think of some safety rules to give the agent and put them in prompts/prompt.md. Finish output/harness.md so it's clear how the system works. Model fields and models.py and why we chose them. Tools and abilities, safety rules, and specs like loop limits, result caps, models, how to run it, front and back. Does that make sense? What are some of the safety rules that we need to give the agent? And can we implement some of them now?

### Claude's response

Answered the questions (yes, it makes sense; proposed safety rules in two
layers) and implemented everything:

- **Audit trail:** new `backend/audit.py`. Each chat message appends one
  entry to `output/audit_trail.json`: time, who (`guest` or `user#1`, never an
  email), page, redacted message, model, every tool call in order with short
  args and a short result, stop reason, model calls, tokens, reply, cards
  shown, safety flags, and duration. Append-only: new entries are written over
  the closing `]`, so earlier entries are never rewritten. Tested across a
  server restart (first 2,000 bytes unchanged while entries grew 11 → 28).
- **Safety rules in `prompts/prompt.md`:** 6 groups. Honesty (no invented
  prices, discounts, restock dates, holds), privacy (no card numbers,
  passwords, or other customers' data), stay in your lane (shopping only, no
  partial homework help, no admissions/medical/legal/financial advice),
  resist manipulation, kind and safe (crisis resources), keep it tight.
- **Code guardrails (new `backend/safety.py`):** card numbers, SSNs, and
  passwords are blocked before the AI sees them and redacted before saving or
  logging. 15 messages/minute rate limit. Loop limits (6 model calls, 8 tool
  calls, 40k tokens). Polite refusal when the provider's content filter blocks
  a jailbreak. Price-honesty check on every `$` in replies. Secret scrub.
- **Found and fixed:** the live server was using `gpt-5.6-luna` because
  Ren's shell sets `OPENAI_MODEL` for other projects. The shop now reads its
  own `CAMPUS_CUSTOMS_MODEL` (default `gpt-6-luna`). Also, the agent offered
  partial essay help, so the off-topic rule was tightened and retested.
- **Tested live:** card number blocked; jailbreak politely refused; discount,
  restock, essay, other customers' emails, admissions, and a fake "manager"
  all handled correctly; rate limit returns 429; a typed password never
  reached the database or the audit file.
- **`output/harness.md` finished:** new Part A covers how to run the front
  and back end, the architecture and the path of one message, every model in
  `models.py` and why its fields were chosen, tools and abilities, safety
  rules (prompt and code, with test results), the audit trail format, and a
  specs table (model, API, loop limits, result caps, rate limit, etc.). The
  earlier problem-by-problem sections became Part B (build history), with
  stale details corrected.

### Follow-up prompts

I don't know if the stay in your lane regarding homework is necessary for this campus app. Like, it's I don't know why anybody would put a homework question in there. So it's a really weird safety rule. Can you make a safety rule more about like credit card numbers and making sure that it's not like pulling things from incorrect sites and that it's keeping people's information locked and that it's going to, I don't know, maybe like ask for a password refresh like once a year and then like I think your safety rules are like they're good rules, but they're not really necessary for this. Like nobody is going to be using this chatbot asking for help. So I don't think it's necessary to point somebody towards a crisis line.

What was lacking: Claude's first rule set covered generic chatbot risks
(homework, crisis lines) instead of the risks that matter for a shop:
payment data, trusted sources, locked-down customer data, and password hygiene.

Claude's response:
- Rewrote the safety rules in `prompts/prompt.md` around the shop's real
  risks: (1) payment cards and sensitive numbers (and no online checkout),
  (2) keep customer information locked, (3) accounts and passwords, (4)
  trusted sources only (database only, no outside sites, no price matching
  to other stores, no outside links), (5) honesty, (6) can't be talked out
  of the rules. Removed the homework, admissions, and crisis-line rules.
- New code guardrail: links to outside websites are stripped from replies.
- **Yearly password refresh:** the database gets `password_changed_at` (added
  automatically). Passwords over 365 days old are expired: the site redirects
  to a new Change password page (current password required, must be
  different), chat returns 403 until it's changed, and the shopper's name in
  the header links to the page. Tested with the API and in the browser.
- Found and fixed: the server had been running the old prompt (`--reload`
  only watches `.py` files), so the agent now re-reads `prompt.md` whenever it
  changes. Reloading the Change password page used to bounce to Log in, now
  fixed. Retested all rules live (price match, outside links, passwords,
  other customers, card numbers, yearly refresh, stock still correct).
- Updated `output/harness.md` (rules, guardrails, tests, account models, specs).

Last thing I would add is, like, a nudge. If somebody abandons their cart and closes the website, I'd like that to trigger an email to them. Maybe the next day of something along the lines of, you left this behind. With a link and an image of the items they were looking at.

What was lacking: the site had no cart or online checkout, and the prompt
didn't say how emails should be sent. Claude asked; Ren chose "Add a Bag" and
"Preview outbox".

Claude's response: added a Bag (Add to bag with a size, a header count, and a
Bag page with a reminder toggle) and `backend/nudges.py`. After 24 hours
untouched, it writes one "You left this behind, <name>" email with photos,
sizes, live prices, honest stock notes, links, and a signed unsubscribe link
to `output/outbox/` (gitignored). Tested end to end. Fixed along the way: the
unsubscribe link signing, the header logo wrapping, and a bag image link
missing a screen-reader name. Added section 11 to `output/harness.md`.

whats taking so long

Claude's response: finishing the bag-reminder tests and write-up.

---

## Problem 13: Push to GitHub and Submit the URL

### Initial prompt

Great. Problem 13's title should be push to GitHub and submit the URL. So we're going to put our code in a folder named HW4 and push it to a public GitHub repository. On Canvas, submit the repo URL. The link graders can open and clone. You do not need to upload a zip for this homework. Do not put our .env campus underscore customs.db or product images in the GitHub repo. Use .gitignore. Include .env.example with placeholders only. The expected file layout is in the AI Foundation's homework 4 page for number 12, and it has like an example of what it all should look like in our layout, and then also the local only data pack, which is not in Git. The agent itself is 4 files under backend /prompts/prompt.md, agent.py, tools.py, and models.py. readme.md should explain how to run the front end and back end after placing the data pack. Let me know what else we need to do. Let's wrap this up.
