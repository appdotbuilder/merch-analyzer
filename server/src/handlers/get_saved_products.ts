
import { db } from '../db';
import { savedProductsTable } from '../db/schema';
import { type SavedProduct } from '../schema';
import { eq, isNotNull } from 'drizzle-orm';

export const getSavedProducts = async (userId: string): Promise<SavedProduct[]> => {
  try {
    // Query saved products for the user, ensuring created_at is not null
    const results = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.user_id, userId))
      .execute();

    // Filter out any records with null created_at and return properly typed results
    return results
      .filter(result => result.created_at !== null)
      .map(result => ({
        id: result.id,
        user_id: result.user_id,
        product_id: result.product_id,
        created_at: result.created_at as Date // Safe cast since we filtered nulls
      }));
  } catch (error) {
    console.error('Failed to fetch saved products:', error);
    throw error;
  }
};
