
import { db } from '../db';
import { reviewHistoryTable } from '../db/schema';
import { type ReviewHistory } from '../schema';
import { eq, desc, gte, and, type SQL } from 'drizzle-orm';

export async function getReviewHistory(productId: number, days?: number): Promise<ReviewHistory[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Always filter by product_id
    conditions.push(eq(reviewHistoryTable.product_id, productId));

    // Add date filter if days parameter is provided
    if (days !== undefined && days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      conditions.push(gte(reviewHistoryTable.date, cutoffDateString));
    }

    // Build and execute query
    const results = await db.select()
      .from(reviewHistoryTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(reviewHistoryTable.date))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(result => ({
      ...result,
      rating: result.rating ? parseFloat(result.rating) : null
    }));
  } catch (error) {
    console.error('Failed to fetch review history:', error);
    throw error;
  }
}
