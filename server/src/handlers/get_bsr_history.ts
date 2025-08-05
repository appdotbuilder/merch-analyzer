
import { db } from '../db';
import { bsrHistoryTable } from '../db/schema';
import { type BsrHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getBsrHistory = async (productId: number): Promise<BsrHistory[]> => {
  try {
    const results = await db.select()
      .from(bsrHistoryTable)
      .where(eq(bsrHistoryTable.product_id, productId))
      .orderBy(desc(bsrHistoryTable.date))
      .execute();

    return results.map(result => ({
      ...result,
      product_id: Number(result.product_id) // Convert bigint to number
    }));
  } catch (error) {
    console.error('BSR history retrieval failed:', error);
    throw error;
  }
};
