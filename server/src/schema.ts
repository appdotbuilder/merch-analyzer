
import { z } from 'zod';

// Marketplace schema
export const marketplaceSchema = z.object({
  id: z.number().int(),
  code: z.enum(['US', 'UK', 'DE']),
  name: z.string()
});

export type Marketplace = z.infer<typeof marketplaceSchema>;

// Product type schema
export const productTypeSchema = z.object({
  id: z.number().int(),
  name: z.string()
});

export type ProductType = z.infer<typeof productTypeSchema>;

// Brand schema
export const brandSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  normalized_name: z.string()
});

export type Brand = z.infer<typeof brandSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  asin: z.string(),
  marketplace_id: z.number().int(),
  product_type_id: z.number().int().nullable(),
  brand_id: z.number().int().nullable(),
  title: z.string().nullable(),
  description_text: z.string().nullable(),
  price: z.number().nullable(),
  currency_code: z.string().default('USD'),
  rating: z.number().nullable(),
  reviews_count: z.number().int().nullable(),
  bsr: z.number().int().nullable(),
  bsr_30_days_avg: z.number().int().nullable(),
  bullet_points: z.array(z.string()).nullable(),
  images: z.array(z.string()).nullable(),
  product_url: z.string().nullable(),
  published_at: z.string().nullable(), // DATE field as string
  deleted: z.boolean().default(false),
  status: z.string().default('pending_enrichment'),
  discovery_query: z.string().nullable(),
  source_type: z.string().default('scraper'),
  first_seen_at: z.coerce.date(),
  last_scraped_at: z.coerce.date().nullable(),
  raw_data: z.record(z.any()).nullable(), // JSONB as generic object
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Product keyword schema
export const productKeywordSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  keyword: z.string()
});

export type ProductKeyword = z.infer<typeof productKeywordSchema>;

// Profile schema
export const profileSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email().nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Profile = z.infer<typeof profileSchema>;

// Excluded brands schema
export const excludedBrandSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  brand_id: z.number().int(),
  created_at: z.coerce.date()
});

export type ExcludedBrand = z.infer<typeof excludedBrandSchema>;

// Excluded keywords schema
export const excludedKeywordSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  keyword: z.string(),
  created_at: z.coerce.date()
});

export type ExcludedKeyword = z.infer<typeof excludedKeywordSchema>;

// Favorite groups schema
export const favoriteGroupSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FavoriteGroup = z.infer<typeof favoriteGroupSchema>;

// User favorite products groups schema
export const userFavoriteProductsGroupSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  product_id: z.number(),
  group_id: z.number(),
  created_at: z.coerce.date()
});

export type UserFavoriteProductsGroup = z.infer<typeof userFavoriteProductsGroupSchema>;

// BSR history schema
export const bsrHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  date: z.string(), // DATE field as string
  bsr: z.number().int().nullable()
});

export type BsrHistory = z.infer<typeof bsrHistorySchema>;

// Price history schema
export const priceHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  date: z.string(), // DATE field as string
  price: z.number().nullable(),
  currency_code: z.string()
});

export type PriceHistory = z.infer<typeof priceHistorySchema>;

// Review history schema
export const reviewHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  date: z.string(), // DATE field as string
  reviews_count: z.number().int().nullable(),
  rating: z.number().nullable()
});

export type ReviewHistory = z.infer<typeof reviewHistorySchema>;

// Daily product stats schema
export const dailyProductStatsSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  date: z.string(), // DATE field as string
  avg_bsr_7: z.number().int().nullable(),
  avg_bsr_30: z.number().int().nullable(),
  avg_bsr_90: z.number().int().nullable()
});

export type DailyProductStats = z.infer<typeof dailyProductStatsSchema>;

// Saved products schema
export const savedProductSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  product_id: z.number(),
  created_at: z.coerce.date()
});

export type SavedProduct = z.infer<typeof savedProductSchema>;

// Chat history schema
export const chatHistorySchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  message: z.string(),
  response: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ChatHistory = z.infer<typeof chatHistorySchema>;

// Scraping sessions schema
export const scrapingSessionSchema = z.object({
  id: z.number(),
  marketplace_id: z.number().int(),
  status: z.string(),
  products_found: z.number().int().nullable(),
  started_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable(),
  query: z.string().nullable()
});

export type ScrapingSession = z.infer<typeof scrapingSessionSchema>;

// Input schemas for handlers
export const createProductInputSchema = z.object({
  asin: z.string(),
  marketplace_id: z.number().int(),
  product_type_id: z.number().int().optional(),
  brand_id: z.number().int().optional(),
  title: z.string().optional(),
  description_text: z.string().optional(),
  price: z.number().optional(),
  currency_code: z.string().default('USD'),
  rating: z.number().optional(),
  reviews_count: z.number().int().optional(),
  bsr: z.number().int().optional(),
  bsr_30_days_avg: z.number().int().optional(),
  bullet_points: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  product_url: z.string().optional(),
  published_at: z.string().optional(),
  discovery_query: z.string().optional(),
  source_type: z.string().default('scraper'),
  raw_data: z.record(z.any()).optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const getProductsInputSchema = z.object({
  marketplace_id: z.number().int().optional(),
  product_type_id: z.number().int().optional(),
  brand_id: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export type GetProductsInput = z.infer<typeof getProductsInputSchema>;
