
import { 
  bigserial, 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean, 
  date,
  smallint,
  jsonb,
  uuid,
  bigint,
  unique,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const marketplacesTable = pgTable('marketplaces', {
  id: smallint('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull()
});

export const productTypesTable = pgTable('product_types', {
  id: smallint('id').primaryKey(),
  name: text('name').notNull().unique()
});

export const brandsTable = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  normalized_name: text('normalized_name').notNull()
});

export const productsTable = pgTable('products', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  asin: text('asin').notNull().unique(),
  marketplace_id: smallint('marketplace_id').notNull().references(() => marketplacesTable.id),
  product_type_id: smallint('product_type_id').references(() => productTypesTable.id),
  brand_id: integer('brand_id').references(() => brandsTable.id),
  title: text('title'),
  description_text: text('description_text'),
  price: numeric('price', { precision: 10, scale: 2 }),
  currency_code: text('currency_code').default('USD'),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  reviews_count: integer('reviews_count'),
  bsr: integer('bsr'),
  bsr_30_days_avg: integer('bsr_30_days_avg'),
  bullet_points: text('bullet_points').array(),
  images: text('images').array(),
  product_url: text('product_url'),
  published_at: date('published_at'),
  deleted: boolean('deleted').default(false),
  status: text('status').notNull().default('pending_enrichment'),
  discovery_query: text('discovery_query'),
  source_type: text('source_type').default('scraper'),
  first_seen_at: timestamp('first_seen_at', { withTimezone: true }).defaultNow(),
  last_scraped_at: timestamp('last_scraped_at', { withTimezone: true }),
  raw_data: jsonb('raw_data'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
}, (table) => ({
  marketplaceIdx: index('idx_products_marketplace_id').on(table.marketplace_id),
  productTypeIdx: index('idx_products_product_type_id').on(table.product_type_id),
  brandIdx: index('idx_products_brand_id').on(table.brand_id),
  priceIdx: index('idx_products_price').on(table.price),
  ratingIdx: index('idx_products_rating').on(table.rating),
  reviewsCountIdx: index('idx_products_reviews_count').on(table.reviews_count),
  bsrIdx: index('idx_products_bsr').on(table.bsr),
  bsr30DaysAvgIdx: index('idx_products_bsr_30_days_avg').on(table.bsr_30_days_avg),
  publishedAtIdx: index('idx_products_published_at').on(table.published_at),
  deletedIdx: index('idx_products_deleted').on(table.deleted),
  firstSeenAtIdx: index('idx_products_first_seen_at_desc').on(table.first_seen_at),
  lastScrapedAtIdx: index('idx_products_last_scraped_at_desc').on(table.last_scraped_at)
}));

export const productKeywordsTable = pgTable('product_keywords', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull()
}, (table) => ({
  productIdIdx: index('idx_product_keywords_product_id').on(table.product_id),
  keywordIdx: index('idx_product_keywords_keyword').on(table.keyword)
}));

export const profilesTable = pgTable('profiles', {
  user_id: uuid('user_id').primaryKey(),
  email: text('email'),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const excludedBrandsTable = pgTable('excluded_brands', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  brand_id: integer('brand_id').notNull().references(() => brandsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const excludedKeywordsTable = pgTable('excluded_keywords', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  keyword: text('keyword').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const favoriteGroupsTable = pgTable('favorite_groups', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const userFavoriteProductsGroupsTable = pgTable('user_favorite_products_groups', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  group_id: bigint('group_id', { mode: 'number' }).notNull().references(() => favoriteGroupsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const bsrHistoryTable = pgTable('bsr_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  bsr: integer('bsr')
}, (table) => ({
  productDateIdx: index('idx_bsr_history_product_date').on(table.product_id, table.date)
}));

export const priceHistoryTable = pgTable('price_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  currency_code: text('currency_code').notNull()
}, (table) => ({
  productDateIdx: index('idx_price_history_product_date').on(table.product_id, table.date)
}));

export const reviewHistoryTable = pgTable('review_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  reviews_count: integer('reviews_count'),
  rating: numeric('rating', { precision: 3, scale: 2 })
}, (table) => ({
  productDateIdx: index('idx_review_history_product_date').on(table.product_id, table.date)
}));

export const dailyProductStatsTable = pgTable('daily_product_stats', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  avg_bsr_7: integer('avg_bsr_7'),
  avg_bsr_30: integer('avg_bsr_30'),
  avg_bsr_90: integer('avg_bsr_90')
}, (table) => ({
  productDateIdx: index('idx_daily_product_stats_product_date').on(table.product_id, table.date)
}));

export const savedProductsTable = pgTable('saved_products', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  product_id: bigint('product_id', { mode: 'number' }).notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const chatHistoryTable = pgTable('chat_history', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  user_id: uuid('user_id').notNull().references(() => profilesTable.user_id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  response: text('response'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const scrapingSessionsTable = pgTable('scraping_sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  marketplace_id: smallint('marketplace_id').notNull().references(() => marketplacesTable.id),
  status: text('status').notNull(),
  products_found: integer('products_found'),
  started_at: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completed_at: timestamp('completed_at', { withTimezone: true }),
  query: text('query')
});

// Relations
export const marketplacesRelations = relations(marketplacesTable, ({ many }) => ({
  products: many(productsTable),
  scrapingSessions: many(scrapingSessionsTable)
}));

export const productTypesRelations = relations(productTypesTable, ({ many }) => ({
  products: many(productsTable)
}));

export const brandsRelations = relations(brandsTable, ({ many }) => ({
  products: many(productsTable),
  excludedBrands: many(excludedBrandsTable)
}));

export const productsRelations = relations(productsTable, ({ one, many }) => ({
  marketplace: one(marketplacesTable, {
    fields: [productsTable.marketplace_id],
    references: [marketplacesTable.id]
  }),
  productType: one(productTypesTable, {
    fields: [productsTable.product_type_id],
    references: [productTypesTable.id]
  }),
  brand: one(brandsTable, {
    fields: [productsTable.brand_id],
    references: [brandsTable.id]
  }),
  keywords: many(productKeywordsTable),
  bsrHistory: many(bsrHistoryTable),
  priceHistory: many(priceHistoryTable),
  reviewHistory: many(reviewHistoryTable),
  dailyStats: many(dailyProductStatsTable),
  savedProducts: many(savedProductsTable),
  userFavoriteGroups: many(userFavoriteProductsGroupsTable)
}));

// Export all tables for proper query building
export const tables = {
  marketplaces: marketplacesTable,
  productTypes: productTypesTable,
  brands: brandsTable,
  products: productsTable,
  productKeywords: productKeywordsTable,
  profiles: profilesTable,
  excludedBrands: excludedBrandsTable,
  excludedKeywords: excludedKeywordsTable,
  favoriteGroups: favoriteGroupsTable,
  userFavoriteProductsGroups: userFavoriteProductsGroupsTable,
  bsrHistory: bsrHistoryTable,
  priceHistory: priceHistoryTable,
  reviewHistory: reviewHistoryTable,
  dailyProductStats: dailyProductStatsTable,
  savedProducts: savedProductsTable,
  chatHistory: chatHistoryTable,
  scrapingSessions: scrapingSessionsTable
};
