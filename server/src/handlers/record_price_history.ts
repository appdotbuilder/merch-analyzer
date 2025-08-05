
import { db } from '../db';
import { priceHistoryTable, productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type PriceHistory } from '../schema';

export const recordPriceHistory = async (
  productId: number, 
  price: number, 
  currency: string
): Promise<PriceHistory> => {
  try {
    // Validate that the product exists
    const product = await db.select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    // Get current date for recording
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Insert price history record
    const result = await db.insert(priceHistoryTable)
      .values({
        product_id: productId,
        date: today,
        price: price.toString(), // Convert number to string for numeric column
        currency_code: currency
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const priceHistory = result[0];
    return {
      ...priceHistory,
      price: priceHistory.price ? parseFloat(priceHistory.price) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Price history recording failed:', error);
    throw error;
  }
};
