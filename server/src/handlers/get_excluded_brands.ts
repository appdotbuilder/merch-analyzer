
import { db } from '../db';
import { excludedBrandsTable, brandsTable } from '../db/schema';
import { type ExcludedBrand } from '../schema';
import { eq } from 'drizzle-orm';

export const getExcludedBrands = async (userId: string): Promise<ExcludedBrand[]> => {
  try {
    // Join excluded_brands with brands table to get complete data
    const results = await db.select({
      id: excludedBrandsTable.id,
      user_id: excludedBrandsTable.user_id,
      brand_id: excludedBrandsTable.brand_id,
      created_at: excludedBrandsTable.created_at
    })
    .from(excludedBrandsTable)
    .innerJoin(brandsTable, eq(excludedBrandsTable.brand_id, brandsTable.id))
    .where(eq(excludedBrandsTable.user_id, userId))
    .execute();

    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      brand_id: result.brand_id,
      created_at: result.created_at || new Date() // Handle potential null
    }));
  } catch (error) {
    console.error('Failed to get excluded brands:', error);
    throw error;
  }
};
