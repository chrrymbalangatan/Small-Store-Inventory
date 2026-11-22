# Sari Sari Store · Stock Inventory

A mobile-first inventory app for small neighborhood stores. Shop owners pick products from a built-in catalog of everyday Filipino store essentials (or add their own with a photo), set a peso selling price and stock count, and tap + / − as stock arrives or sells. It can be installed to a phone's home screen as a web app, and the catalog keeps working offline.

## Screens

- **Overview** – a quick-start banner and "Your shelves", a per-category summary of saved products and units.
- **Inventory** – only the products the store has added, with category tabs, search, stock filter, sort, and grid/list views. New products are added through **Add item**, which opens the catalog picker.
- **Categories** – the four shelves (Pantry, Snacks, Beverages, Household Supplies) with catalog photos and how many of each are in inventory.
- **Getting started** and **Install app** dialogs (the Install button sits in the top bar).

## Tech

- React 19 + Vite (client, in `src/`)
- Netlify Server running a Hono API at `/api/*` (`netlify/server/index.ts`)
- Netlify Database (Postgres) with Drizzle ORM for saved products (`db/`)
- Netlify Blobs for uploaded product photos
- A service worker (`public/sw.js`) for offline catalog and installability

Each browser gets its own anonymous store through a cookie, so no sign-up is needed.

## Run locally

```bash
npm install
netlify dev --port 8889
```

After changing `db/schema.ts`, generate a migration with `npx drizzle-kit generate --name <change>`. Migrations are applied automatically on deploy.
