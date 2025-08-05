
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        asin: input.asin,
        marketplace_id: input.marketplace_id,
        product_type_id: input.product_type_id || null,
        brand_id: input.brand_id || null,
        title: input.title || null,
        description_text: input.description_text || null,
        price: input.price ? input.price.toString() : null,
        currency_code: input.currency_code,
        rating: input.rating ? input.rating.toString() : null,
        reviews_count: input.reviews_count || null,
        bsr: input.bsr || null,
        bsr_30_days_avg: input.bsr_30_days_avg || null,
        bullet_points: input.bullet_points || null,
        images: input.images || null,
        product_url: input.product_url || null,
        published_at: input.published_at || null,
        discovery_query: input.discovery_query || null,
        source_type: input.source_type,
        raw_data: input.raw_data || null
      })
      .returning()
      .execute();

    // Convert the database result to match the Product type
    const product = result[0];
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
      deleted: product.deleted || false, // Ensure non-null with default
      status: product.status || 'pending_enrichment', // Ensure non-null with default
      discovery_query: product.discovery_query,
      source_type: product.source_type || 'scraper', // Ensure non-null with default
      first_seen_at: product.first_seen_at || new Date(), // Ensure non-null with default
      last_scraped_at: product.last_scraped_at,
      raw_data: product.raw_data as Record<string, any> | null, // Type assertion for JSONB field
      created_at: product.created_at || new Date(), // Ensure non-null with default
      updated_at: product.updated_at || new Date() // Ensure non-null with default
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};
