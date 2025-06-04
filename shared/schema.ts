import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  description: text("description"),
  imageUrl: text("image_url"),
});

export const retailers = pgTable("retailers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  retailerId: integer("retailer_id").notNull().references(() => retailers.id),
  price: text("price").notNull(),
  stock: text("stock"),
  url: text("url"),
});

export const scanHistory = pgTable("scan_history", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull(),
  productName: text("product_name").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  bestPrice: text("best_price"),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  addedAt: timestamp("added_at").defaultNow(),
});

export const shoppingListItems = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").default(1),
  unitPrice: varchar("unit_price"), // User-defined price override
  completed: boolean("completed").default(false),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
  favorites: many(favorites),
  shoppingListItems: many(shoppingListItems),
}));

export const retailersRelations = relations(retailers, ({ many }) => ({
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
  retailer: one(retailers, {
    fields: [prices.retailerId],
    references: [retailers.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));

export const shoppingListItemsRelations = relations(shoppingListItems, ({ one }) => ({
  product: one(products, {
    fields: [shoppingListItems.productId],
    references: [products.id],
  }),
}));

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertRetailerSchema = createInsertSchema(retailers).omit({
  id: true,
});

export const insertPriceSchema = createInsertSchema(prices).omit({
  id: true,
});

export const insertScanHistorySchema = createInsertSchema(scanHistory).omit({
  id: true,
  scannedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  addedAt: true,
});

export const insertShoppingListItemSchema = createInsertSchema(shoppingListItems).omit({
  id: true,
  addedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Retailer = typeof retailers.$inferSelect;
export type InsertRetailer = z.infer<typeof insertRetailerSchema>;

export type Price = typeof prices.$inferSelect;
export type InsertPrice = z.infer<typeof insertPriceSchema>;

export type ScanHistory = typeof scanHistory.$inferSelect;
export type InsertScanHistory = z.infer<typeof insertScanHistorySchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type InsertShoppingListItem = z.infer<typeof insertShoppingListItemSchema>;

// Client-side types for API responses
export interface ProductWithPrices extends Product {
  prices: (Price & { retailer: Retailer })[];
}

export interface ScanResult {
  product: ProductWithPrices;
  bestPrice: string;
}
