
import { db } from '../db';
import { productKeywordsTable, productsTable } from '../db/schema';
import { type ProductKeyword } from '../schema';
import { eq } from 'drizzle-orm';

export const addProductKeyword = async (productId: number, keyword: string): Promise<ProductKeyword> => {
  try {
    // Verify product exists first to prevent foreign key constraint violations
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1)
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Insert the product keyword
    const result = await db.insert(productKeywordsTable)
      .values({
        product_id: productId,
        keyword: keyword
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Failed to add product keyword:', error);
    throw error;
  }
};
