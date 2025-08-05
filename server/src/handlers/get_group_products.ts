
import { db } from '../db';
import { productsTable, userFavoriteProductsGroupsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getGroupProducts(groupId: number): Promise<Product[]> {
  try {
    const results = await db.select({
      // Select all product fields
      id: productsTable.id,
      asin: productsTable.asin,
      marketplace_id: productsTable.marketplace_id,
      product_type_id: productsTable.product_type_id,
      brand_id: productsTable.brand_id,
      title: productsTable.title,
      description_text: productsTable.description_text,
      price: productsTable.price,
      currency_code: productsTable.currency_code,
      rating: productsTable.rating,
      reviews_count: productsTable.reviews_count,
      bsr: productsTable.bsr,
      bsr_30_days_avg: productsTable.bsr_30_days_avg,
      bullet_points: productsTable.bullet_points,
      images: productsTable.images,
      product_url: productsTable.product_url,
      published_at: productsTable.published_at,
      deleted: productsTable.deleted,
      status: productsTable.status,
      discovery_query: productsTable.discovery_query,
      source_type: productsTable.source_type,
      first_seen_at: productsTable.first_seen_at,
      last_scraped_at: productsTable.last_scraped_at,
      raw_data: productsTable.raw_data,
      created_at: productsTable.created_at,
      updated_at: productsTable.updated_at,
      // Select created_at from favorite groups for ordering
      added_at: userFavoriteProductsGroupsTable.created_at
    })
    .from(userFavoriteProductsGroupsTable)
    .innerJoin(
      productsTable,
      eq(userFavoriteProductsGroupsTable.product_id, productsTable.id)
    )
    .where(eq(userFavoriteProductsGroupsTable.group_id, groupId))
    .orderBy(desc(userFavoriteProductsGroupsTable.created_at))
    .execute();

    // Convert numeric fields from strings to numbers and handle non-null defaults
    return results.map(result => ({
      id: result.id,
      asin: result.asin,
      marketplace_id: result.marketplace_id,
      product_type_id: result.product_type_id,
      brand_id: result.brand_id,
      title: result.title,
      description_text: result.description_text,
      price: result.price ? parseFloat(result.price) : null,
      currency_code: result.currency_code || 'USD', // Default to USD if null
      rating: result.rating ? parseFloat(result.rating) : null,
      reviews_count: result.reviews_count,
      bsr: result.bsr,
      bsr_30_days_avg: result.bsr_30_days_avg,
      bullet_points: result.bullet_points,
      images: result.images,
      product_url: result.product_url,
      published_at: result.published_at,
      deleted: result.deleted || false, // Default to false if null
      status: result.status,
      discovery_query: result.discovery_query,
      source_type: result.source_type || 'scraper', // Default to scraper if null
      first_seen_at: result.first_seen_at || new Date(), // Default to current date if null
      last_scraped_at: result.last_scraped_at,
      raw_data: result.raw_data as Record<string, any> | null,
      created_at: result.created_at || new Date(), // Default to current date if null
      updated_at: result.updated_at || new Date() // Default to current date if null
    }));
  } catch (error) {
    console.error('Failed to get group products:', error);
    throw error;
  }
}
