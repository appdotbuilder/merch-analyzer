
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductByAsin = async (asin: string): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.asin, asin))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];

    // Convert and handle type mismatches between DB schema and Zod schema
    return {
      id: product.id,
      asin: product.asin,
      marketplace_id: product.marketplace_id,
      product_type_id: product.product_type_id,
      brand_id: product.brand_id,
      title: product.title,
      description_text: product.description_text,
      price: product.price ? parseFloat(product.price) : null,
      currency_code: product.currency_code || 'USD', // Default to USD if null
      rating: product.rating ? parseFloat(product.rating) : null,
      reviews_count: product.reviews_count,
      bsr: product.bsr,
      bsr_30_days_avg: product.bsr_30_days_avg,
      bullet_points: product.bullet_points,
      images: product.images,
      product_url: product.product_url,
      published_at: product.published_at,
      deleted: product.deleted || false, // Default to false if null
      status: product.status,
      discovery_query: product.discovery_query,
      source_type: product.source_type || 'scraper', // Default to scraper if null
      first_seen_at: product.first_seen_at || new Date(), // Default to current date if null
      last_scraped_at: product.last_scraped_at,
      raw_data: product.raw_data as Record<string, any> | null, // Type assertion for JSONB field
      created_at: product.created_at || new Date(), // Default to current date if null
      updated_at: product.updated_at || new Date() // Default to current date if null
    };
  } catch (error) {
    console.error('Failed to get product by ASIN:', error);
    throw error;
  }
};
