
import { db } from '../db';
import { reviewHistoryTable, productsTable } from '../db/schema';
import { type ReviewHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const recordReviewHistory = async (
  productId: number, 
  rating: number, 
  reviewCount: number
): Promise<ReviewHistory> => {
  try {
    // Validate that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1)
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${productId} not found`);
    }

    // Get current date (without time component)
    const currentDate = new Date().toISOString().split('T')[0];

    // Insert review history record
    const result = await db.insert(reviewHistoryTable)
      .values({
        product_id: productId,
        date: currentDate,
        reviews_count: reviewCount,
        rating: rating.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const reviewHistory = result[0];
    return {
      ...reviewHistory,
      rating: reviewHistory.rating ? parseFloat(reviewHistory.rating) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Review history recording failed:', error);
    throw error;
  }
};
