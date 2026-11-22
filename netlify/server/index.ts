import { Hono, type Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getStore } from "@netlify/blobs";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { items } from "../../db/schema.ts";

const CATEGORIES = ["Pantry", "Snacks", "Beverages", "Household Supplies"];
const UNITS = [
  "piece (piraso)",
  "pack (pakete)",
  "sachet",
  "can (lata)",
  "bottle (bote)",
  "kilogram (kilo)",
  "gram",
  "liter (litro)",
  "bundle (tali)",
  "box (kahon)",
];
const MAX_PHOTO = 10 * 1024 * 1024;
const COOKIE = "sari_store";
const ID_RE = /^[a-f0-9-]{36}$/;
const PHOTO_RE = /^(\/img\/products\/product-\d{2}\.webp|\/api\/photos\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.jpg)?$/;

const photos = getStore("product-photos");
const app = new Hono();

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Each browser gets its own anonymous store, identified by a long-lived cookie.
function storeId(c: Context) {
  let id = getCookie(c, COOKIE);
  if (!id || !ID_RE.test(id)) id = crypto.randomUUID();
  // Re-issue on every request so an active store never expires (browsers cap cookies at 400 days).
  setCookie(c, COOKIE, id, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

const toClient = (row: typeof items.$inferSelect) => ({
  id: row.id,
  catalogId: row.catalogId,
  name: row.name,
  flavor: row.flavor,
  category: row.category,
  unit: row.unit,
  size: row.size,
  photo: row.photo,
  stock: row.stock,
  price: row.price,
  lowStock: row.lowStock,
  version: row.version,
});

function int(value: unknown, field: string, max = 1_000_000) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) throw new HttpError(400, `Enter a valid ${field}.`);
  return n;
}

function text(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parseItem(body: any) {
  const name = text(body?.name);
  if (!name) throw new HttpError(400, "Enter a product name.");
  const category = CATEGORIES.includes(body?.category) ? body.category : null;
  if (!category) throw new HttpError(400, "Choose a category.");
  const unit = UNITS.includes(body?.unit) ? body.unit : null;
  if (!unit) throw new HttpError(400, "Choose a selling unit.");
  const photo = typeof body?.photo === "string" ? body.photo : "";
  if (!PHOTO_RE.test(photo)) throw new HttpError(400, "This photo could not be saved.");
  const catalogId = body?.catalogId == null ? null : int(body.catalogId, "product", 1000);
  return {
    catalogId,
    name,
    flavor: text(body?.flavor),
    category,
    unit,
    size: text(body?.size, 40),
    photo,
    stock: int(body?.stock ?? 0, "stock count"),
    price: int(body?.price, "peso price", 100_000_000),
    lowStock: int(body?.lowStock ?? 5, "low stock alert"),
  };
}

async function readJson(c: Context) {
  try {
    return await c.req.json();
  } catch {
    throw new HttpError(400, "Something went wrong. Please try again.");
  }
}

// Keep every API response out of shared caches and never leak URLs to other sites.
app.use("/api/*", async (c, next) => {
  await next();
  if (!c.res.headers.has("Cache-Control")) c.header("Cache-Control", "private, no-store");
  c.header("Vary", "Cookie");
});

app.onError((err, c) => {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status as any);
  console.error(err);
  return c.json({ error: "The store connection is unavailable. Please try again." }, 500);
});

app.get("/api/inventory", async (c) => {
  const store = storeId(c);
  const rows = await db.select().from(items).where(eq(items.storeId, store)).orderBy(asc(items.createdAt));
  c.header("Cache-Control", "no-store");
  return c.json({ items: rows.map(toClient) });
});

app.post("/api/items", async (c) => {
  const store = storeId(c);
  const data = parseItem(await readJson(c));
  if (data.catalogId != null) {
    const existing = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.storeId, store), eq(items.catalogId, data.catalogId)));
    if (existing.length) throw new HttpError(409, "This product is already in your inventory.");
  }
  const [row] = await db.insert(items).values({ ...data, storeId: store }).returning();
  return c.json({ item: toClient(row) }, 201);
});

app.put("/api/items/:id", async (c) => {
  const store = storeId(c);
  const id = int(c.req.param("id"), "item", 2 ** 31 - 1);
  const body = await readJson(c);
  const data = parseItem(body);
  const version = Number(body?.version);
  if (!Number.isInteger(version)) throw new HttpError(400, "Refresh your inventory and try again.");
  const [row] = await db
    .update(items)
    .set({ ...data, catalogId: undefined, version: sql`${items.version} + 1`, updatedAt: new Date() })
    .where(and(eq(items.id, id), eq(items.storeId, store), eq(items.version, version)))
    .returning();
  if (!row) throw new HttpError(409, "This item changed somewhere else. Refresh and try again.");
  return c.json({ item: toClient(row) });
});

app.post("/api/items/:id/stock", async (c) => {
  const store = storeId(c);
  const id = int(c.req.param("id"), "item", 2 ** 31 - 1);
  const delta = Number((await readJson(c))?.delta);
  if (!Number.isInteger(delta) || Math.abs(delta) > 10_000) throw new HttpError(400, "Enter a valid stock change.");
  const [row] = await db
    .update(items)
    .set({
      stock: sql`GREATEST(0, ${items.stock} + ${delta})`,
      version: sql`${items.version} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, id), eq(items.storeId, store)))
    .returning();
  if (!row) throw new HttpError(404, "This item is no longer in your inventory.");
  return c.json({ item: toClient(row) });
});

app.delete("/api/items/:id", async (c) => {
  const store = storeId(c);
  const id = int(c.req.param("id"), "item", 2 ** 31 - 1);
  const [row] = await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.storeId, store)))
    .returning();
  if (!row) throw new HttpError(404, "This item is no longer in your inventory.");
  return c.json({ ok: true });
});

app.post("/api/photos", async (c) => {
  const store = storeId(c);
  if (!c.req.header("content-type")?.startsWith("image/jpeg")) throw new HttpError(400, "Choose a JPEG, PNG, or WebP photo.");
  const data = await c.req.arrayBuffer();
  if (!data.byteLength || data.byteLength > MAX_PHOTO) throw new HttpError(400, "Choose a photo smaller than 10 MB.");
  const key = `${store}/${crypto.randomUUID()}.jpg`;
  await photos.set(key, data, { metadata: { contentType: "image/jpeg" } });
  return c.json({ photo: `/api/photos/${key}` }, 201);
});

app.get("/api/photos/:store/:file", async (c) => {
  const { store, file } = c.req.param();
  // Photos are private: only the browser that owns the store (same cookie) can load them.
  if (getCookie(c, COOKIE) !== store) return c.json({ error: "Not found" }, 404);
  if (!ID_RE.test(store) || !/^[a-f0-9-]{36}\.jpg$/.test(file)) return c.json({ error: "Not found" }, 404);
  const blob = await photos.get(`${store}/${file}`, { type: "arrayBuffer" });
  if (!blob) return c.json({ error: "Not found" }, 404);
  return new Response(blob, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=31536000, immutable" },
  });
});

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

export const config = { path: "/api/*" };

export default app;
