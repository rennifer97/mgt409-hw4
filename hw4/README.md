# Campus Customs Shop + Chatbot (MGT409 Homework 4)

An online storefront for Campus Customs (officially licensed Yale apparel, 57
Broadway, New Haven) with a PydanticAI shopping assistant. Shoppers browse
102 products. The chat checks real stock, puts matching products on the page
as cards, remembers logged-in customers, and suggests in-stock alternatives
when a size is sold out.

- **Frontend:** React + Vite + TypeScript (`frontend/`, port 5173)
- **Backend:** FastAPI + PydanticAI agent (`backend/`, port 8000)
- **Data:** SQLite data pack (`data/`, local only, not in git)

How it all works (models, tools, safety, audit trail, specs): `output/harness.md`.

## 1. Place the data pack

The course data pack is **not in this repo**. Copy it into `data/`:

```
hw4/
└── data/
    ├── campus_customs.db     # catalogue, inventory, users, chat_messages
    └── products/             # 102 product photos (*.jpg)
```

On first start the backend makes a few additive changes to that database: a
`password_changed_at` column on `users` and three new tables (`bag_items`,
`nudge_emails`, `email_prefs`). Existing data isn't changed.

## 2. Add your keys

```bash
cp .env.example .env
```

Then fill in `.env`:

| Variable | Required | What it is |
|---|---|---|
| `PORTKEY_API_KEY` | yes | Portkey gateway key for the AI model |
| `SESSION_SECRET` | recommended | Any long random string; signs login tokens. Without it, everyone is logged out when the server restarts. |
| `CAMPUS_CUSTOMS_MODEL` | no | Model name; defaults to `gpt-6-luna` |

`.env` is gitignored. Never commit it.

## 3. Run the backend (terminal 1)

Requires Python 3.12+.

```bash
cd hw4
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd backend
uvicorn main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

## 4. Run the frontend (terminal 2)

Requires Node 20+.

```bash
cd hw4/frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite forwards `/api` and `/media` to the backend on port 8000.

## 5. Try it

- **Test login:** `test@campuscustoms.yale.edu` / `password` (from the data pack)
- In the **Ask the concierge** chat:
  - "What hoodies do you have?" puts 27 hoodie cards on the page.
  - "How many Ice Hockey Left Chest Hoodies do you have in small?" gives the real count from the database.
  - On the Crew Left Chest Hoodie page, "Do you have this in medium?" says it's sold out and shows in-stock alternatives.
- Log in again later and the chat says "Welcome back" with what you were last looking at.
- Pick a size and tap **Add to bag**. A bag left untouched for 24 hours gets a
  "You left this behind" email, saved as a preview in `output/outbox/`.

## Layout

```
hw4/
├── AI_prompts.md          # prompt log, one section per problem
├── README.md
├── requirements.txt
├── .env.example           # variable names only
├── .gitignore             # keeps .env, the database, product photos, outbox out of git
├── frontend/              # Vite + React + TypeScript storefront
├── backend/
│   ├── main.py            # FastAPI app (uvicorn main:app --reload --port 8000)
│   ├── prompts/prompt.md  # agent system prompt: voice, tool rules, safety rules
│   ├── agent.py           # agent wiring: model, prompt, tools, loop limits, audit
│   ├── tools.py           # agent tools (catalogue, stock, search, alternatives)
│   ├── models.py          # Pydantic / PydanticAI types
│   ├── auth.py            # password hashing + signed login tokens
│   ├── memory.py          # saved chat history + welcome back
│   ├── safety.py          # code guardrails (card numbers, rate limit, price check)
│   ├── audit.py           # append-only audit trail
│   ├── bag.py, nudges.py  # bag + "you left this behind" reminder emails
│   ├── benchmark.py       # speed/token benchmark (Problem 9)
│   └── app_check.py       # automated site test (Problem 11)
├── output/
│   ├── harness.md         # how the system works
│   ├── design.md          # Problem 10 design write-up (+ design_images/)
│   ├── usability.md       # Problem 9 improvements
│   ├── app_check.html     # Problem 11 site test (+ app_check_images/)
│   ├── audit_trail.json   # agent activity log (append-only)
│   └── benchmark.json     # Problem 9 before/after measurements
└── data/                  # local data pack (NOT in git)
```

## Optional tools

From `backend/`, with the backend running where noted:

- `python benchmark.py`: time and token benchmark for the agent.
- `python app_check.py`: re-runs the Problem 11 site test and rebuilds
  `output/app_check.html`. Needs both servers running and Google Chrome installed.
- `python nudges.py --dry-run`: lists which bags are due for a reminder email.

## Credits

Campus photos on the site are from Wikimedia Commons (CC BY / CC BY-SA),
linked rather than copied, and credited in the site footer. Product photos
and data are from the course data pack.
