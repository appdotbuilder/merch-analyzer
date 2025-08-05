
import { db } from '../db';
import { excludedBrandsTable, excludedKeywordsTable, profilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the input and output types locally since they're missing from schema.ts
export interface CreateUserPreferenceInput {
  user_id: string;
  excluded_brands?: number[];
  excluded_keywords?: string[];
  preferred_marketplaces?: number[];
  preferred_product_types?: number[];
}

export interface UserPreference {
  id: number;
  user_id: string;
  excluded_brands: number[];
  excluded_keywords: string[];
  preferred_marketplaces: number[];
  preferred_product_types: number[];
  created_at: Date;
  updated_at: Date;
}

export async function createUserPreference(input: CreateUserPreferenceInput): Promise<UserPreference> {
  try {
    // Start a transaction to handle all preference updates atomically
    const result = await db.transaction(async (tx) => {
      // First, ensure the user profile exists
      const existingProfiles = await tx.select()
        .from(profilesTable)
        .where(eq(profilesTable.user_id, input.user_id))
        .execute();

      if (existingProfiles.length === 0) {
        // Create basic profile if it doesn't exist
        await tx.insert(profilesTable)
          .values({
            user_id: input.user_id,
            created_at: new Date(),
            updated_at: new Date()
          })
          .execute();
      }

      // Handle excluded brands - remove existing ones first, then add new ones
      if (input.excluded_brands && input.excluded_brands.length > 0) {
        // Remove existing excluded brands for this user
        await tx.delete(excludedBrandsTable)
          .where(eq(excludedBrandsTable.user_id, input.user_id))
          .execute();

        // Insert new excluded brands
        const brandValues = input.excluded_brands.map((brandId: number) => ({
          user_id: input.user_id,
          brand_id: brandId,
          created_at: new Date()
        }));

        await tx.insert(excludedBrandsTable)
          .values(brandValues)
          .execute();
      }

      // Handle excluded keywords - remove existing ones first, then add new ones
      if (input.excluded_keywords && input.excluded_keywords.length > 0) {
        // Remove existing excluded keywords for this user
        await tx.delete(excludedKeywordsTable)
          .where(eq(excludedKeywordsTable.user_id, input.user_id))
          .execute();

        // Insert new excluded keywords
        const keywordValues = input.excluded_keywords.map((keyword: string) => ({
          user_id: input.user_id,
          keyword: keyword,
          created_at: new Date()
        }));

        await tx.insert(excludedKeywordsTable)
          .values(keywordValues)
          .execute();
      }

      // Get current excluded brands
      const excludedBrands = await tx.select()
        .from(excludedBrandsTable)
        .where(eq(excludedBrandsTable.user_id, input.user_id))
        .execute();

      // Get current excluded keywords
      const excludedKeywords = await tx.select()
        .from(excludedKeywordsTable)
        .where(eq(excludedKeywordsTable.user_id, input.user_id))
        .execute();

      // Return the complete user preference object
      return {
        id: 1, // Using a placeholder ID since preferences are spread across multiple tables
        user_id: input.user_id,
        excluded_brands: excludedBrands.map(eb => eb.brand_id),
        excluded_keywords: excludedKeywords.map(ek => ek.keyword),
        preferred_marketplaces: input.preferred_marketplaces || [],
        preferred_product_types: input.preferred_product_types || [],
        created_at: new Date(),
        updated_at: new Date()
      };
    });

    return result;
  } catch (error) {
    console.error('User preference creation failed:', error);
    throw error;
  }
}
