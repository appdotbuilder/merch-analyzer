
import { db } from '../db';
import { savedProductsTable, productsTable, profilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

// Define the input type inline since it's missing from schema.ts
type CreateSavedProductInput = {
  user_id: string;
  product_id: number;
};

// Define the output type inline based on the table structure
type SavedProduct = {
  id: number;
  user_id: string;
  product_id: number;
  created_at: Date;
};

export const createSavedProduct = async (input: CreateSavedProductInput): Promise<SavedProduct> => {
  try {
    // Verify that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Verify that the user profile exists
    const profile = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, input.user_id))
      .execute();

    if (profile.length === 0) {
      throw new Error(`User profile with id ${input.user_id} not found`);
    }

    // Insert saved product record
    const result = await db.insert(savedProductsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id
      })
      .returning()
      .execute();

    // Handle potential null created_at by providing current date as fallback
    const savedProduct = result[0];
    return {
      ...savedProduct,
      created_at: savedProduct.created_at || new Date()
    };
  } catch (error) {
    console.error('Saved product creation failed:', error);
    throw error;
  }
};
