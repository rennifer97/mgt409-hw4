# Design: Campus Customs Storefront (Problem 10)

**Goal:** make Campus Customs feel like a premium retailer (Nike, J.Crew,
Everlane), not a generic campus shop. It's aimed at incoming students who
just got into Yale, and at the families and alumni cheering them on.

**Research:** we studied 10 apparel sites (Nike, Everlane, and J.Crew read
directly; Zara, H&M, Uniqlo, Lululemon, Aritzia, COS, and Patagonia through
design write-ups). They share a few patterns: full-bleed editorial photos, a
neutral palette with one accent, small uppercase navigation, flat product
photos, curated collections, and lots of white space. We used those patterns.

Screenshots: `output/design_images/` (home, shop, product, home-mobile).

---

## What we changed and why it helps people stay and buy

| Area | What changed | Why it helps |
|---|---|---|
| **Fonts** | Cormorant Garamond (serif) for headlines with italic accents ("Now *wear it.*"); Inter for everything else; small uppercase, letter-spaced labels for navigation and buttons. | A serif feels heritage and "Ivy" without being stuffy, and the clean sans keeps prices and sizes easy to read. Shoppers trust a store that looks established. |
| **Color** | Warm white and "bone" backgrounds, near-black ink, and **Yale blue as the only accent**. Deep navy for the announcement bar, colleges section, and footer. Red is used only for "Low stock". | One accent color looks intentional and premium, and keeps the eye on the products. Red stands out only when it matters (urgency). |
| **Hierarchy** | Announcement bar, then a sticky header (shop links left, centered wordmark, account right) that **shrinks on scroll**. Each section: small blue eyebrow, big serif title, one link. Breadcrumbs on shop and product pages. | Shoppers always know where they are and what to do next, and the menu is always one tap away without blocking the products. |
| **Hero** | Full-bleed photo of Yale players in navy YALE jerseys, a slow zoom, and the headline **"You made it. Now wear it."** for the Class of 2030. Two buttons: *Shop the Welcome Collection* / *Find your college*. | Speaks to the emotional moment of getting in. Pride is the reason people buy college gear, and the hero sells that feeling first. |
| **Collections** | New **Welcome Collection** (10 first-week essentials, "Class of 2030 pick" badges), **Residential Colleges**, **Yale Family**, and **Game Day**, each in the menu, as filter pills, and as homepage sections. | Curated edits turn 102 products into easy choices. "Find your college" and "For the proud ones who got you here" target the two biggest buyers: new students and parents. |
| **"Find your college"** | Navy section with crest-shaped **monogram tiles** for the 11 colleges we stock (BF, SY, TD…), each linking to that college's gear. | Residential-college identity is unique to Yale and a strong reason to buy a second item. The tiles are fun to tap and make a deep catalogue feel personal. |
| **Product presentation** | Flat **4:5 photos** edge to edge (no shadows), small badges (*Class of 2030 pick*, *Low stock*), color **swatches**, category label, and **in-stock sizes that slide up on hover**. A homepage **carousel** for the Welcome Collection and category tiles with counts. | Shoppers see fit and availability before clicking, which means fewer dead ends. Badges add social proof and urgency. Big, consistent photos are what make Nike and Everlane grids look premium. |
| **Shop page** | Category tabs with counts, collection pills, search, and sort (featured, price, name), all saved in the URL so a parent can share "Hoodies" or "Saybrook". | Fast narrowing keeps people browsing instead of leaving. Shareable links bring more people in. |
| **Product page** | Large photo with zoom on hover; a **sticky buy panel** with serif name, price, swatches, a **size grid** (sold-out sizes crossed out), a live stock note ("Only 5 left in M"), the main button **"Ask the concierge about M"**, store pickup, Details / Size & fit / Pickup accordions, and **You might also like**. | Everything needed to decide sits on one screen. Live scarcity nudges action. Related items and the concierge keep shoppers on the site when their size is gone. |
| **Motion** | Hero slow zoom and text rise; a scrolling **motto band** ("Lux et Veritas ✦ Class of 2030 ✦ Boola Boola"), which pauses on hover; sections **fade up** on scroll; card image zoom and size reveal; underline animations in the menu; the header shrinks; the chat slides in; typing dots. All of it switches off for shoppers whose device asks for reduced motion. | Small, calm motion makes the site feel alive and expensive without slowing anyone down. |
| **Chat feel** | Restyled as the **Campus Customs Concierge**: dark header with "CC" avatar and an "Online · checks real stock" status, rounded message bubbles, typing dots, and **suggested-question chips** ("Gift ideas for my parents", "Show me Saybrook gear"). The homepage concierge section and product pages can **open the chat with a question already sent**. | A concierge feels like a store employee, not a support widget. The chips show new visitors what to ask, and connecting the chat to product pages turns "is my size in?" into a one-tap answer, with alternatives shown as cards. |
| **Storytelling** | Editorial blocks: Game Day (cheerleaders at the Yale Bowl), Yale Family (the giant inflatable Handsome Dan), the concierge over Ingalls Rink, and an About page with a split hero and store stats. | Lifestyle photos of Yale gear in action let shoppers picture themselves in it, which is how real retailers sell. |
| **Account pages** | Split layout: photo plus quote ("Welcome back, Bulldog." / "Welcome to the family.") beside a clean form. | Makes signing up feel like joining something, which encourages accounts (and saved chats). |
| **Footer** | Four columns (Shop, Collections, Visit, brand + *Lux et Veritas*) and photo credits. | Ends every page with more ways to keep shopping. |

## Photos (free license, shown with credit)

Four Wikimedia Commons photos that show Yale apparel are linked (not copied
into the repo) and credited in the site footer:

| Use | Photo | Credit / license |
|---|---|---|
| Hero | Yale Bulldogs football players | Kenneth Zirkel, CC BY-SA 3.0 |
| Game Day | Yale cheerleaders at the Yale Bowl | Kenneth Zirkel, CC BY-SA 3.0 |
| Family / About | Inflatable Handsome Dan, YALE collar | Ragesoss, CC BY-SA 4.0 |
| Concierge | Harvard–Yale hockey at Ingalls Rink | Nickknack00, CC BY-SA 4.0 |

Product photos come from the course data pack.

## Kept working

- **Accessibility:** axe-core shows **0 violations** on all 7 pages after the redesign (chat open).
- **Mobile:** every page fits a 390 px phone with no sideways scrolling, and the menu becomes a slide-down button.
- Chat search cards, welcome back, login, and saved chats all work unchanged.
