
import { db } from '../db';
import { dailyProductStatsTable } from '../db/schema';
import { type DailyProductStats } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getDailyProductStats = async (productId: number): Promise<DailyProductStats[]> => {
  try {
    const results = await db.select()
      .from(dailyProductStatsTable)
      .where(eq(dailyProductStatsTable.product_id, productId))
      .orderBy(desc(dailyProductStatsTable.date))
      .execute();

    return results.map(stat => ({
      ...stat,
      // Convert date to string format for schema compliance
      date: stat.date || ''
    }));
  } catch (error) {
    console.error('Failed to fetch daily product stats:', error);
    throw error;
  }
};
