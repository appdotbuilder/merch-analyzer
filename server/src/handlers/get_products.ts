
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsInput, type Product } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getProducts = async (input: GetProductsInput): Promise<Product[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input.marketplace_id !== undefined) {
      conditions.push(eq(productsTable.marketplace_id, input.marketplace_id));
    }

    if (input.product_type_id !== undefined) {
      conditions.push(eq(productsTable.product_type_id, input.product_type_id));
    }

    if (input.brand_id !== undefined) {
      conditions.push(eq(productsTable.brand_id, input.brand_id));
    }

    // Build and execute query
    const query = db.select().from(productsTable);
    
    const results = conditions.length > 0
      ? await query
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await query
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    // Convert numeric fields back to numbers and handle type conversions
    return results.map(product => ({
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      rating: product.rating ? parseFloat(product.rating) : null,
      currency_code: product.currency_code || 'USD', // Handle nullable currency_code
      deleted: product.deleted || false, // Handle nullable deleted
      status: product.status, // Already string and not null
      source_type: product.source_type || 'scraper', // Handle nullable source_type
      first_seen_at: product.first_seen_at || new Date(), // Handle nullable first_seen_at
      created_at: product.created_at || new Date(), // Handle nullable created_at
      updated_at: product.updated_at || new Date(), // Handle nullable updated_at
      raw_data: product.raw_data as Record<string, any> | null // Type assertion for raw_data
    }));
  } catch (error) {
    console.error('Failed to get products:', error);
    throw error;
  }
};
