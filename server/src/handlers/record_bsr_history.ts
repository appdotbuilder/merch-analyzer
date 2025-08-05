
import { db } from '../db';
import { bsrHistoryTable, productsTable } from '../db/schema';
import { type BsrHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const recordBsrHistory = async (productId: number, bsr: number): Promise<BsrHistory> => {
  try {
    // Validate that the product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1)
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${productId} not found`);
    }

    // Get current date in YYYY-MM-DD format for DATE column
    const currentDate = new Date().toISOString().split('T')[0];

    // Insert BSR history record
    const result = await db.insert(bsrHistoryTable)
      .values({
        product_id: productId,
        date: currentDate,
        bsr: bsr
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('BSR history recording failed:', error);
    throw error;
  }
};
