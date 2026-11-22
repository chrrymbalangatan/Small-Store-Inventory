# AGENTS.md

## Overview
Sari Sari Store inventory: a React + Vite single-page app with a Netlify Server API. Originally recreated from an earlier version of the same app, with these product decisions applied:
- No activity history (no nav item, no activity table, no history copy).
- No overview stat boxes (products/total stock/running low/inventory value).
- The Inventory page lists **only saved items**; the full catalog appears only in the Add item picker. Categories still show catalog products.
- The top-bar Refresh button was replaced by an **Install** button that opens the install dialog.
- The "3 steps" guide has no intro line and no "stay in the same browser" note.

## Layout
- `src/App.jsx` – app shell, pages (overview, inventory, categories), modals, data loading.
- `src/components.jsx` – product card, category tabs, modal, picker, item form, delete confirm, guide, install guide.
- `src/catalog.js` – built-in catalog (37 products, photos in `public/img/products/`), categories, units, formatters.
- `src/api.js` – `fetch` wrapper for `/api` and client-side photo downscaling.
- `src/styles.css` – all styles (some unused legacy selectors such as `.stats` remain harmlessly).
- `netlify/server/index.ts` – Hono API, `config.path = "/api/*"`.
- `db/schema.ts`, `db/index.ts` – Drizzle schema/client; migrations in `netlify/database/migrations/`.
- `public/sw.js` – service worker; bump the `CACHE` name when cached asset lists change.

## API
- `GET /api/inventory` → `{ items }` for the cookie's store
- `POST /api/items`, `PUT /api/items/:id` (optimistic `version`), `DELETE /api/items/:id`
- `POST /api/items/:id/stock` `{ delta }`
- `POST /api/photos` (JPEG body) → `{ photo: "/api/photos/<store>/<id>.jpg" }`, served by `GET /api/photos/:store/:file` from Blobs store `product-photos`

## Conventions
- Prices are stored as integer centavos.
- Store identity is the httpOnly `sari_store` cookie (UUID); every query filters by `store_id`.
- Never edit applied migrations; change `db/schema.ts` and run `npx drizzle-kit generate --name <change>`.
- The `sari_store` cookie max-age must stay ≤ 400 days (Hono throws otherwise); it is re-issued on every request.
- Server imports use `.ts` extensions (`../../db/index.ts`) so `netlify dev` can load them; avoid TS parameter properties (unsupported in Node strip-only mode).
- On mobile the navigation sits at the top, under the header (sticky), so the bottom of the screen stays clear.
