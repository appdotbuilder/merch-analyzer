
import { db } from '../db';
import { priceHistoryTable } from '../db/schema';
import { type PriceHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPriceHistory = async (productId: number): Promise<PriceHistory[]> => {
  try {
    const results = await db.select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.product_id, productId))
      .orderBy(desc(priceHistoryTable.date))
      .execute();

    // Convert numeric price fields back to numbers
    return results.map(record => ({
      ...record,
      price: record.price ? parseFloat(record.price) : null
    }));
  } catch (error) {
    console.error('Price history fetch failed:', error);
    throw error;
  }
};
