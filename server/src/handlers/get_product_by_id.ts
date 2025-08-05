
import { db } from '../db';
import { productsTable, marketplacesTable, productTypesTable, brandsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    // Query with joins to get related data
    const results = await db.select()
      .from(productsTable)
      .leftJoin(marketplacesTable, eq(productsTable.marketplace_id, marketplacesTable.id))
      .leftJoin(productTypesTable, eq(productsTable.product_type_id, productTypesTable.id))
      .leftJoin(brandsTable, eq(productsTable.brand_id, brandsTable.id))
      .where(eq(productsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    const product = result.products;

    // Convert and ensure proper types match Product schema
    return {
      id: product.id,
      asin: product.asin,
      marketplace_id: product.marketplace_id,
      product_type_id: product.product_type_id,
      brand_id: product.brand_id,
      title: product.title,
      description_text: product.description_text,
      price: product.price ? parseFloat(product.price) : null,
      currency_code: product.currency_code || 'USD', // Ensure non-null with default
      rating: product.rating ? parseFloat(product.rating) : null,
      reviews_count: product.reviews_count,
      bsr: product.bsr,
      bsr_30_days_avg: product.bsr_30_days_avg,
      bullet_points: product.bullet_points,
      images: product.images,
      product_url: product.product_url,
      published_at: product.published_at,
      deleted: product.deleted ?? false, // Ensure non-null with default
      status: product.status || 'pending_enrichment', // Ensure non-null with default
      discovery_query: product.discovery_query,
      source_type: product.source_type || 'scraper', // Ensure non-null with default
      first_seen_at: product.first_seen_at || new Date(), // Ensure non-null with fallback
      last_scraped_at: product.last_scraped_at,
      raw_data: product.raw_data as Record<string, any> | null,
      created_at: product.created_at || new Date(), // Ensure non-null with fallback
      updated_at: product.updated_at || new Date() // Ensure non-null with fallback
    };
  } catch (error) {
    console.error('Failed to get product by id:', error);
    throw error;
  }
};
