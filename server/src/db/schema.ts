
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const marketplaceEnum = pgEnum('marketplace', ['USA', 'UK', 'Germany']);
export const productTypeEnum = pgEnum('product_type', ['T-Shirt', 'Tank Top', 'Long Sleeve', 'Hoodie', 'Sweatshirt', 'V-Neck', 'Premium', 'Other']);
export const scrapingPhaseEnum = pgEnum('scraping_phase', ['Discovery', 'Enrichment']);
export const scrapingStatusEnum = pgEnum('scraping_status', ['Success', 'Failed', 'Skipped']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  asin: text('asin').notNull(),
  title: text('title').notNull(),
  marketplace: marketplaceEnum('marketplace').notNull(),
  product_type: productTypeEnum('product_type').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  currency: text('currency'),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  review_count: integer('review_count'),
  bsr: integer('bsr'),
  bsr_category: text('bsr_category'),
  image_url: text('image_url'),
  product_url: text('product_url').notNull(),
  brand: text('brand'),
  publication_date: timestamp('publication_date'),
  last_scraped_at: timestamp('last_scraped_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  asinMarketplaceIdx: uniqueIndex('products_asin_marketplace_idx').on(table.asin, table.marketplace),
  bsrIdx: index('products_bsr_idx').on(table.bsr),
  priceIdx: index('products_price_idx').on(table.price),
  ratingIdx: index('products_rating_idx').on(table.rating),
  publicationDateIdx: index('products_publication_date_idx').on(table.publication_date)
}));

// BSR History table
export const bsrHistoryTable = pgTable('bsr_history', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  bsr: integer('bsr').notNull(),
  bsr_category: text('bsr_category').notNull(),
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  productIdIdx: index('bsr_history_product_id_idx').on(table.product_id),
  recordedAtIdx: index('bsr_history_recorded_at_idx').on(table.recorded_at)
}));

// Price History table
export const priceHistoryTable = pgTable('price_history', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  productIdIdx: index('price_history_product_id_idx').on(table.product_id),
  recordedAtIdx: index('price_history_recorded_at_idx').on(table.recorded_at)
}));

// Review History table
export const reviewHistoryTable = pgTable('review_history', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  rating: numeric('rating', { precision: 3, scale: 2 }).notNull(),
  review_count: integer('review_count').notNull(),
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  productIdIdx: index('review_history_product_id_idx').on(table.product_id),
  recordedAtIdx: index('review_history_recorded_at_idx').on(table.recorded_at)
}));

// User Preferences table
export const userPreferencesTable = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull().unique(),
  excluded_brands: jsonb('excluded_brands').notNull().default([]),
  excluded_keywords: jsonb('excluded_keywords').notNull().default([]),
  preferred_marketplaces: jsonb('preferred_marketplaces').notNull().default([]),
  preferred_product_types: jsonb('preferred_product_types').notNull().default([]),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Favorite Groups table
export const favoriteGroupsTable = pgTable('favorite_groups', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Favorite Group Products junction table
export const favoriteGroupProductsTable = pgTable('favorite_group_products', {
  id: serial('id').primaryKey(),
  group_id: integer('group_id').notNull().references(() => favoriteGroupsTable.id, { onDelete: 'cascade' }),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  added_at: timestamp('added_at').defaultNow().notNull()
}, (table) => ({
  groupProductIdx: uniqueIndex('favorite_group_products_group_product_idx').on(table.group_id, table.product_id)
}));

// Scraping Logs table
export const scrapingLogsTable = pgTable('scraping_logs', {
  id: serial('id').primaryKey(),
  phase: scrapingPhaseEnum('phase').notNull(),
  product_id: integer('product_id').references(() => productsTable.id),
  asin: text('asin'),
  marketplace: marketplaceEnum('marketplace').notNull(),
  status: scrapingStatusEnum('status').notNull(),
  error_message: text('error_message'),
  scraped_at: timestamp('scraped_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  phaseIdx: index('scraping_logs_phase_idx').on(table.phase),
  statusIdx: index('scraping_logs_status_idx').on(table.status),
  scrapedAtIdx: index('scraping_logs_scraped_at_idx').on(table.scraped_at)
}));

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  bsrHistory: many(bsrHistoryTable),
  priceHistory: many(priceHistoryTable),
  reviewHistory: many(reviewHistoryTable),
  favoriteGroupProducts: many(favoriteGroupProductsTable),
  scrapingLogs: many(scrapingLogsTable)
}));

export const bsrHistoryRelations = relations(bsrHistoryTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [bsrHistoryTable.product_id],
    references: [productsTable.id]
  })
}));

export const priceHistoryRelations = relations(priceHistoryTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [priceHistoryTable.product_id],
    references: [productsTable.id]
  })
}));

export const reviewHistoryRelations = relations(reviewHistoryTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [reviewHistoryTable.product_id],
    references: [productsTable.id]
  })
}));

export const favoriteGroupsRelations = relations(favoriteGroupsTable, ({ many }) => ({
  products: many(favoriteGroupProductsTable)
}));

export const favoriteGroupProductsRelations = relations(favoriteGroupProductsTable, ({ one }) => ({
  group: one(favoriteGroupsTable, {
    fields: [favoriteGroupProductsTable.group_id],
    references: [favoriteGroupsTable.id]
  }),
  product: one(productsTable, {
    fields: [favoriteGroupProductsTable.product_id],
    references: [productsTable.id]
  })
}));

export const scrapingLogsRelations = relations(scrapingLogsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [scrapingLogsTable.product_id],
    references: [productsTable.id]
  })
}));

// TypeScript types for tables
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type BsrHistory = typeof bsrHistoryTable.$inferSelect;
export type NewBsrHistory = typeof bsrHistoryTable.$inferInsert;
export type PriceHistory = typeof priceHistoryTable.$inferSelect;
export type NewPriceHistory = typeof priceHistoryTable.$inferInsert;
export type ReviewHistory = typeof reviewHistoryTable.$inferSelect;
export type NewReviewHistory = typeof reviewHistoryTable.$inferInsert;
export type UserPreference = typeof userPreferencesTable.$inferSelect;
export type NewUserPreference = typeof userPreferencesTable.$inferInsert;
export type FavoriteGroup = typeof favoriteGroupsTable.$inferSelect;
export type NewFavoriteGroup = typeof favoriteGroupsTable.$inferInsert;
export type FavoriteGroupProduct = typeof favoriteGroupProductsTable.$inferSelect;
export type NewFavoriteGroupProduct = typeof favoriteGroupProductsTable.$inferInsert;
export type ScrapingLog = typeof scrapingLogsTable.$inferSelect;
export type NewScrapingLog = typeof scrapingLogsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  products: productsTable,
  bsrHistory: bsrHistoryTable,
  priceHistory: priceHistoryTable,
  reviewHistory: reviewHistoryTable,
  userPreferences: userPreferencesTable,
  favoriteGroups: favoriteGroupsTable,
  favoriteGroupProducts: favoriteGroupProductsTable,
  scrapingLogs: scrapingLogsTable
};
