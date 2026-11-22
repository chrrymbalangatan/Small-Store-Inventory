import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

// One row per product a store has added to its inventory.
// `storeId` is an anonymous per-browser id kept in a cookie.
export const items = pgTable(
  "items",
  {
    id: serial().primaryKey(),
    storeId: text("store_id").notNull(),
    catalogId: integer("catalog_id"),
    name: text().notNull(),
    flavor: text().notNull().default(""),
    category: text().notNull(),
    unit: text().notNull(),
    size: text().notNull().default(""),
    photo: text().notNull().default(""),
    stock: integer().notNull().default(0),
    price: integer().notNull().default(0), // centavos
    lowStock: integer("low_stock").notNull().default(5),
    version: integer().notNull().default(1),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("items_store_idx").on(t.storeId)],
);
