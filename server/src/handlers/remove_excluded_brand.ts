
import { db } from '../db';
import { excludedBrandsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface RemoveExcludedBrandInput {
  user_id: string;
  brand_id: number;
}

export const removeExcludedBrand = async (input: RemoveExcludedBrandInput): Promise<void> => {
  try {
    // Delete the excluded brand record for this user and brand
    await db.delete(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, input.user_id),
          eq(excludedBrandsTable.brand_id, input.brand_id)
        )
      )
      .execute();
  } catch (error) {
    console.error('Remove excluded brand failed:', error);
    throw error;
  }
};
