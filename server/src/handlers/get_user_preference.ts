
import { db } from '../db';
import { excludedBrandsTable, excludedKeywordsTable, favoriteGroupsTable, brandsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define UserPreference type since it's missing from schema
export interface UserPreference {
  user_id: string;
  excluded_brands: Array<{
    id: number;
    brand_id: number;
    brand_name: string;
    created_at: Date;
  }>;
  excluded_keywords: Array<{
    id: number;
    keyword: string;
    created_at: Date;
  }>;
  favorite_groups: Array<{
    id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
  }>;
}

export async function getUserPreference(userId: string): Promise<UserPreference | null> {
  try {
    // Fetch excluded brands with brand names
    const excludedBrandsResult = await db.select({
      id: excludedBrandsTable.id,
      brand_id: excludedBrandsTable.brand_id,
      brand_name: brandsTable.name,
      created_at: excludedBrandsTable.created_at
    })
    .from(excludedBrandsTable)
    .innerJoin(brandsTable, eq(excludedBrandsTable.brand_id, brandsTable.id))
    .where(eq(excludedBrandsTable.user_id, userId))
    .execute();

    // Fetch excluded keywords
    const excludedKeywordsResult = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, userId))
      .execute();

    // Fetch favorite groups
    const favoriteGroupsResult = await db.select()
      .from(favoriteGroupsTable)
      .where(eq(favoriteGroupsTable.user_id, userId))
      .execute();

    // If no preferences exist at all, return null
    if (excludedBrandsResult.length === 0 && 
        excludedKeywordsResult.length === 0 && 
        favoriteGroupsResult.length === 0) {
      return null;
    }

    // Build the user preference object
    const userPreference: UserPreference = {
      user_id: userId,
      excluded_brands: excludedBrandsResult.map(item => ({
        id: item.id,
        brand_id: item.brand_id,
        brand_name: item.brand_name,
        created_at: item.created_at || new Date() // Handle nullable date
      })),
      excluded_keywords: excludedKeywordsResult.map(item => ({
        id: item.id,
        keyword: item.keyword,
        created_at: item.created_at || new Date() // Handle nullable date
      })),
      favorite_groups: favoriteGroupsResult.map(item => ({
        id: item.id,
        name: item.name,
        created_at: item.created_at || new Date(), // Handle nullable date
        updated_at: item.updated_at || new Date() // Handle nullable date
      }))
    };

    return userPreference;
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
}
