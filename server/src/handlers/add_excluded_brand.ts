
import { db } from '../db';
import { excludedBrandsTable, brandsTable, profilesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Define the input type inline since it's missing from schema
type AddExcludedBrandInput = {
  user_id: string;
  brand_id: number;
};

// Define the return type inline since it's missing from schema
type ExcludedBrand = {
  id: number;
  user_id: string;
  brand_id: number;
  created_at: Date;
};

export const addExcludedBrand = async (input: AddExcludedBrandInput): Promise<ExcludedBrand> => {
  try {
    // Verify that the user exists
    const userExists = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error('User not found');
    }

    // Verify that the brand exists
    const brandExists = await db.select()
      .from(brandsTable)
      .where(eq(brandsTable.id, input.brand_id))
      .execute();

    if (brandExists.length === 0) {
      throw new Error('Brand not found');
    }

    // Check if the excluded brand already exists
    const existingExcludedBrand = await db.select()
      .from(excludedBrandsTable)
      .where(and(
        eq(excludedBrandsTable.user_id, input.user_id),
        eq(excludedBrandsTable.brand_id, input.brand_id)
      ))
      .execute();

    if (existingExcludedBrand.length > 0) {
      throw new Error('Brand is already excluded for this user');
    }

    // Insert excluded brand record
    const result = await db.insert(excludedBrandsTable)
      .values({
        user_id: input.user_id,
        brand_id: input.brand_id
      })
      .returning()
      .execute();

    // Handle the potential null created_at by providing a default
    const excludedBrand = result[0];
    return {
      ...excludedBrand,
      created_at: excludedBrand.created_at || new Date()
    };
  } catch (error) {
    console.error('Failed to add excluded brand:', error);
    throw error;
  }
};
