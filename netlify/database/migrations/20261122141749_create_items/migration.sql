CREATE TABLE "items" (
	"id" serial PRIMARY KEY,
	"store_id" text NOT NULL,
	"catalog_id" integer,
	"name" text NOT NULL,
	"flavor" text DEFAULT '' NOT NULL,
	"category" text NOT NULL,
	"unit" text NOT NULL,
	"size" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"low_stock" integer DEFAULT 5 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "items_store_idx" ON "items" ("store_id");