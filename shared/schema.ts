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
  subscriptionTier: varchar("subscription_tier").default("free"), // free, premium, business
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  dailyScansCount: integer("daily_scans_count").default(0),
  lastScanResetDate: timestamp("last_scan_reset_date").defaultNow(),
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
  ecoScore: integer("eco_score"), // 1-100 overall environmental score
  carbonFootprint: text("carbon_footprint"), // CO2 equivalent in kg
  recyclingInfo: text("recycling_info"), // Recycling instructions
  sustainabilityCertifications: text("sustainability_certifications").array(), // Organic, Fair Trade, etc.
  packagingType: text("packaging_type"), // Plastic, Cardboard, Glass, etc.
  isEcoFriendly: boolean("is_eco_friendly").default(false),
});

export const retailers = pgTable("retailers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  affiliateProgram: boolean("affiliate_program").default(false),
  affiliateCommissionRate: text("affiliate_commission_rate"), // e.g., "3.5%"
  affiliateBaseUrl: text("affiliate_base_url"), // Base URL for affiliate links
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

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response"),
  timestamp: timestamp("timestamp").defaultNow(),
  isUser: boolean("is_user").notNull(),
});

export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  targetPrice: text("target_price").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastChecked: timestamp("last_checked"),
});

export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  targetUrl: text("target_url"),
  advertiser: text("advertiser").notNull(),
  adType: text("ad_type").notNull(), // 'banner', 'sponsored_product', 'native'
  placement: text("placement").notNull(), // 'home', 'search_results', 'product_detail'
  isActive: boolean("is_active").default(true),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adClicks = pgTable("ad_clicks", {
  id: serial("id").primaryKey(),
  advertisementId: integer("advertisement_id").notNull().references(() => advertisements.id),
  userId: varchar("user_id").references(() => users.id),
  clickedAt: timestamp("clicked_at").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

// Affiliate tracking for monetization
export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  retailerId: integer("retailer_id").notNull().references(() => retailers.id),
  clickedAt: timestamp("clicked_at").defaultNow(),
  affiliateUrl: text("affiliate_url").notNull(),
  commissionRate: text("commission_rate"),
  estimatedCommission: text("estimated_commission"),
  conversionTracked: boolean("conversion_tracked").default(false),
  actualCommission: text("actual_commission"),
  commissionPaidAt: timestamp("commission_paid_at"),
});

// Subscription payments and revenue tracking
export const subscriptionPayments = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  planType: varchar("plan_type").notNull(), // premium, business
  amount: text("amount").notNull(),
  currency: varchar("currency").default("USD"),
  paymentMethod: varchar("payment_method"), // stripe, paypal, etc.
  paymentId: text("payment_id"), // External payment processor ID
  status: varchar("status").default("pending"), // pending, completed, failed, refunded
  subscriptionStartDate: timestamp("subscription_start_date").notNull(),
  subscriptionEndDate: timestamp("subscription_end_date").notNull(),
  isRecurring: boolean("is_recurring").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Revenue analytics and reporting
export const revenueMetrics = pgTable("revenue_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  affiliateRevenue: text("affiliate_revenue").default("0.00"),
  subscriptionRevenue: text("subscription_revenue").default("0.00"),
  adRevenue: text("ad_revenue").default("0.00"),
  totalRevenue: text("total_revenue").default("0.00"),
  activeSubscribers: integer("active_subscribers").default(0),
  newSubscribers: integer("new_subscribers").default(0),
  churnedSubscribers: integer("churned_subscribers").default(0),
  affiliateClicks: integer("affiliate_clicks").default(0),
  affiliateConversions: integer("affiliate_conversions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium feature usage tracking
export const featureUsage = pgTable("feature_usage", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  feature: varchar("feature").notNull(), // price_alerts, bulk_scan, analytics, api_access
  usageCount: integer("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  subscriptionTierAtUsage: varchar("subscription_tier_at_usage"),
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

export const priceAlertsRelations = relations(priceAlerts, ({ one }) => ({
  product: one(products, {
    fields: [priceAlerts.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [priceAlerts.userId],
    references: [users.id],
  }),
}));

export const advertisementsRelations = relations(advertisements, ({ many }) => ({
  clicks: many(adClicks),
}));

export const adClicksRelations = relations(adClicks, ({ one }) => ({
  advertisement: one(advertisements, {
    fields: [adClicks.advertisementId],
    references: [advertisements.id],
  }),
  user: one(users, {
    fields: [adClicks.userId],
    references: [users.id],
  }),
}));

export const affiliateClicksRelations = relations(affiliateClicks, ({ one }) => ({
  user: one(users, {
    fields: [affiliateClicks.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [affiliateClicks.productId],
    references: [products.id],
  }),
  retailer: one(retailers, {
    fields: [affiliateClicks.retailerId],
    references: [retailers.id],
  }),
}));

export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  user: one(users, {
    fields: [subscriptionPayments.userId],
    references: [users.id],
  }),
}));

export const featureUsageRelations = relations(featureUsage, ({ one }) => ({
  user: one(users, {
    fields: [featureUsage.userId],
    references: [users.id],
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

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  createdAt: true,
  lastChecked: true,
});

export const insertAdvertisementSchema = createInsertSchema(advertisements).omit({
  id: true,
  impressions: true,
  clicks: true,
  createdAt: true,
});

export const insertAdClickSchema = createInsertSchema(adClicks).omit({
  id: true,
  clickedAt: true,
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

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;

export type AdClick = typeof adClicks.$inferSelect;
export type InsertAdClick = z.infer<typeof insertAdClickSchema>;

// Monetization type definitions
export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  clickedAt: true,
});

export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).omit({
  id: true,
  createdAt: true,
});

export const insertRevenueMetricSchema = createInsertSchema(revenueMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureUsageSchema = createInsertSchema(featureUsage).omit({
  id: true,
  lastUsedAt: true,
});

export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;

export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type InsertSubscriptionPayment = z.infer<typeof insertSubscriptionPaymentSchema>;

export type RevenueMetric = typeof revenueMetrics.$inferSelect;
export type InsertRevenueMetric = z.infer<typeof insertRevenueMetricSchema>;

export type FeatureUsage = typeof featureUsage.$inferSelect;
export type InsertFeatureUsage = z.infer<typeof insertFeatureUsageSchema>;

// Client-side types for API responses
export interface ProductWithPrices extends Product {
  prices: (Price & { retailer: Retailer })[];
}

export interface ScanResult {
  product: ProductWithPrices;
  bestPrice: string;
}

// Monetization interfaces
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  interval: "month" | "year";
  features: string[];
  dailyScanLimit?: number;
  priceAlerts: boolean;
  bulkScanning: boolean;
  analytics: boolean;
  apiAccess: boolean;
}

export interface RevenueAnalytics {
  totalRevenue: string;
  affiliateRevenue: string;
  subscriptionRevenue: string;
  adRevenue: string;
  activeSubscribers: number;
  conversionRate: number;
  averageRevenuePerUser: string;
  topAffiliatePartners: Array<{
    retailer: string;
    clicks: number;
    conversions: number;
    revenue: string;
  }>;
}
