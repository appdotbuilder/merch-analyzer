
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Define the update input schema inline since it's missing from schema.ts
const updateProductInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description_text: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency_code: z.string().optional(),
  rating: z.number().nullable().optional(),
  reviews_count: z.number().int().optional(),
  bsr: z.number().int().optional(),
  bsr_30_days_avg: z.number().int().optional(),
  bullet_points: z.array(z.string()).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  product_url: z.string().optional(),
  published_at: z.string().optional(),
  status: z.string().optional(),
  discovery_query: z.string().nullable().optional(),
  source_type: z.string().optional(),
  raw_data: z.record(z.any()).nullable().optional(),
  last_scraped_at: z.coerce.date().optional()
});

type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // Prepare update values, converting numeric fields to strings for database storage
    const updateValues: any = {};
    
    if (input.title !== undefined) updateValues.title = input.title;
    if (input.description_text !== undefined) updateValues.description_text = input.description_text;
    if (input.price !== undefined) {
      updateValues.price = input.price !== null ? input.price.toString() : null;
    }
    if (input.currency_code !== undefined) updateValues.currency_code = input.currency_code;
    if (input.rating !== undefined) {
      updateValues.rating = input.rating !== null ? input.rating.toString() : null;
    }
    if (input.reviews_count !== undefined) updateValues.reviews_count = input.reviews_count;
    if (input.bsr !== undefined) updateValues.bsr = input.bsr;
    if (input.bsr_30_days_avg !== undefined) updateValues.bsr_30_days_avg = input.bsr_30_days_avg;
    if (input.bullet_points !== undefined) updateValues.bullet_points = input.bullet_points;
    if (input.images !== undefined) updateValues.images = input.images;
    if (input.product_url !== undefined) updateValues.product_url = input.product_url;
    if (input.published_at !== undefined) updateValues.published_at = input.published_at;
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.discovery_query !== undefined) updateValues.discovery_query = input.discovery_query;
    if (input.source_type !== undefined) updateValues.source_type = input.source_type;
    if (input.raw_data !== undefined) updateValues.raw_data = input.raw_data;
    if (input.last_scraped_at !== undefined) updateValues.last_scraped_at = input.last_scraped_at;
    
    // Always update the updated_at timestamp
    updateValues.updated_at = new Date();

    // Update the product record
    const result = await db.update(productsTable)
      .set(updateValues)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Product with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers and properly cast raw_data
    const product = result[0];
    return {
      ...product,
      price: product.price ? parseFloat(product.price) : null,
      rating: product.rating ? parseFloat(product.rating) : null,
      raw_data: product.raw_data as Record<string, any> | null,
      // Ensure required fields have proper defaults
      currency_code: product.currency_code || 'USD',
      deleted: product.deleted || false,
      status: product.status || 'pending_enrichment',
      source_type: product.source_type || 'scraper',
      first_seen_at: product.first_seen_at || new Date(),
      created_at: product.created_at || new Date(),
      updated_at: product.updated_at || new Date()
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};
