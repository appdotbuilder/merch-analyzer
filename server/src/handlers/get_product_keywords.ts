
import { db } from '../db';
import { productKeywordsTable } from '../db/schema';
import { type ProductKeyword } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductKeywords = async (productId: number): Promise<ProductKeyword[]> => {
  try {
    const results = await db.select()
      .from(productKeywordsTable)
      .where(eq(productKeywordsTable.product_id, productId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get product keywords:', error);
    throw error;
  }
};
