
import { z } from 'zod';

// Enums
export const marketplaceEnum = z.enum(['USA', 'UK', 'Germany']);
export const productTypeEnum = z.enum(['T-Shirt', 'Tank Top', 'Long Sleeve', 'Hoodie', 'Sweatshirt', 'V-Neck', 'Premium', 'Other']);
export const scrapingPhaseEnum = z.enum(['Discovery', 'Enrichment']);

// Product schema
export const productSchema = z.object({
  id: z.number(),
  asin: z.string(),
  title: z.string(),
  marketplace: marketplaceEnum,
  product_type: productTypeEnum,
  price: z.number().nullable(),
  currency: z.string().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().int().nullable(),
  bsr: z.number().int().nullable(),
  bsr_category: z.string().nullable(),
  image_url: z.string().nullable(),
  product_url: z.string(),
  brand: z.string().nullable(),
  publication_date: z.coerce.date().nullable(),
  last_scraped_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Historical data schemas
export const bsrHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  bsr: z.number().int(),
  bsr_category: z.string(),
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type BsrHistory = z.infer<typeof bsrHistorySchema>;

export const priceHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  price: z.number(),
  currency: z.string(),
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type PriceHistory = z.infer<typeof priceHistorySchema>;

export const reviewHistorySchema = z.object({
  id: z.number(),
  product_id: z.number(),
  rating: z.number(),
  review_count: z.number().int(),
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ReviewHistory = z.infer<typeof reviewHistorySchema>;

// User preferences schema
export const userPreferenceSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  excluded_brands: z.array(z.string()),
  excluded_keywords: z.array(z.string()),
  preferred_marketplaces: z.array(marketplaceEnum),
  preferred_product_types: z.array(productTypeEnum),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserPreference = z.infer<typeof userPreferenceSchema>;

// Favorite groups schema
export const favoriteGroupSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FavoriteGroup = z.infer<typeof favoriteGroupSchema>;

export const favoriteGroupProductSchema = z.object({
  id: z.number(),
  group_id: z.number(),
  product_id: z.number(),
  added_at: z.coerce.date()
});

export type FavoriteGroupProduct = z.infer<typeof favoriteGroupProductSchema>;

// Scraping log schema
export const scrapingLogSchema = z.object({
  id: z.number(),
  phase: scrapingPhaseEnum,
  product_id: z.number().nullable(),
  asin: z.string().nullable(),
  marketplace: marketplaceEnum,
  status: z.enum(['Success', 'Failed', 'Skipped']),
  error_message: z.string().nullable(),
  scraped_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type ScrapingLog = z.infer<typeof scrapingLogSchema>;

// Input schemas for creating/updating
export const createProductInputSchema = z.object({
  asin: z.string(),
  title: z.string(),
  marketplace: marketplaceEnum,
  product_type: productTypeEnum,
  price: z.number().nullable(),
  currency: z.string().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().int().nullable(),
  bsr: z.number().int().nullable(),
  bsr_category: z.string().nullable(),
  image_url: z.string().nullable(),
  product_url: z.string(),
  brand: z.string().nullable(),
  publication_date: z.coerce.date().nullable()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  review_count: z.number().int().nullable().optional(),
  bsr: z.number().int().nullable().optional(),
  bsr_category: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  publication_date: z.coerce.date().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const productFilterSchema = z.object({
  marketplace: marketplaceEnum.optional(),
  product_type: productTypeEnum.optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  min_bsr: z.number().int().optional(),
  max_bsr: z.number().int().optional(),
  min_rating: z.number().optional(),
  max_rating: z.number().optional(),
  min_review_count: z.number().int().optional(),
  max_review_count: z.number().int().optional(),
  publication_date_from: z.coerce.date().optional(),
  publication_date_to: z.coerce.date().optional(),
  search_query: z.string().optional(),
  excluded_brands: z.array(z.string()).optional(),
  excluded_keywords: z.array(z.string()).optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type ProductFilter = z.infer<typeof productFilterSchema>;

export const createUserPreferenceInputSchema = z.object({
  user_id: z.string(),
  excluded_brands: z.array(z.string()).default([]),
  excluded_keywords: z.array(z.string()).default([]),
  preferred_marketplaces: z.array(marketplaceEnum).default([]),
  preferred_product_types: z.array(productTypeEnum).default([])
});

export type CreateUserPreferenceInput = z.infer<typeof createUserPreferenceInputSchema>;

export const createFavoriteGroupInputSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable()
});

export type CreateFavoriteGroupInput = z.infer<typeof createFavoriteGroupInputSchema>;

export const addProductToGroupInputSchema = z.object({
  group_id: z.number(),
  product_id: z.number()
});

export type AddProductToGroupInput = z.infer<typeof addProductToGroupInputSchema>;

export const createScrapingLogInputSchema = z.object({
  phase: scrapingPhaseEnum,
  product_id: z.number().nullable(),
  asin: z.string().nullable(),
  marketplace: marketplaceEnum,
  status: z.enum(['Success', 'Failed', 'Skipped']),
  error_message: z.string().nullable()
});

export type CreateScrapingLogInput = z.infer<typeof createScrapingLogInputSchema>;
