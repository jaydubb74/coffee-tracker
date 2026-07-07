# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server on port 5174 (per .claude/launch.json)
npm run build      # production build to dist/
npm run lint       # ESLint
npm run preview    # serve the production build locally
```

To run the dev server at the configured port:
```bash
npm run dev -- --port 5174
```

To apply schema changes to the linked Supabase project:
```bash
SUPABASE_ACCESS_TOKEN=<sbp_...> supabase db query --linked --file supabase-schema.sql
```

There are no tests.

## Architecture

**WineYak** is a crowdsourced review platform for coffee and ice cream, deployed on Vercel (GitHub auto-deploy from `jaydubb74/coffee-tracker`), backed by Supabase.

### Data model (Supabase — project `dguoyckwjrgrcbkuguts`)

Three tables:
- **`products`** — the canonical catalog. `category` is `'coffee' | 'ice_cream'`. `unique(category, brand, variant)` prevents duplicates. Price normalization: coffee → per 12 oz, ice cream → per pint (16 oz). `roast_type` is coffee-only; null for everything else.
- **`reviews`** — join between a product and a `auth.users` user. `rating` is 1–100. No computed average is stored; every page calculates it from raw rows at query time.
- **`profiles`** — auto-created via a `handle_new_user` trigger on `auth.users` insert. Stores `display_name`.

Storage bucket: `coffee-photos` (public). Images are uploaded at review submission time and their URL is written back to `products.image_url`.

RLS is enabled on all tables. All reads are public. Writes require `authenticated` role; reviews are further scoped to `auth.uid() = user_id`.

### Frontend structure

`src/lib/categories.js` is the single source of truth for category behavior — labels, emoji, price units, roast type lists, and the `normalizePrice()` utility. Import `CATEGORIES[product.category]` anywhere you need category-aware display or `categoryOf(product)` as a safe helper.

`src/lib/supabase.js` exports a single `supabase` client (anon key, from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`).

`src/context/AuthContext.jsx` exposes `{ user, loading }` via `useAuth()`. `user` is the raw Supabase `User` object or `null`.

Routes (React Router v7):
- `/` → `Landing` — hero + top-5 coffee / top-5 ice cream leaderboards + value props
- `/reviews` → `ReviewFeed` — paginated feed with category tabs, brand filter, search
- `/product/:id` → `ProductDetail` — single product with all reviews; owners can edit/delete
- `/add` → `AddReview` (auth-gated) — category picker → product selector or new product form → review form
- `/login` → `Login`
- `/coffee/:id` → redirects to `/reviews` (legacy)

### Design system

All styling is inline React styles using CSS custom properties defined in `src/index.css`. No Tailwind utilities are used in components — Tailwind is imported but the design token system (`--color-*`, `--space-*`, `--font-*`, `--text-*`, `--radius-*`) is the actual design language. Fonts: Playfair Display (display/headings), DM Sans (body), DM Mono (labels/mono).

`ScoreRing` is the shared rating component — renders a circular badge with color thresholds: ≥85 green, ≥70 amber, <70 roast-brown.

### Legacy files

`src/pages/AddCoffee.jsx`, `src/pages/CoffeeDetail.jsx`, and `src/pages/CoffeeList.jsx` are the old single-category pages and are no longer routed. They can be deleted.
