
import { db } from '../db';
import { userFavoriteProductsGroupsTable, favoriteGroupsTable, productsTable } from '../db/schema';
import { type UserFavoriteProductsGroup } from '../schema';
import { eq, and } from 'drizzle-orm';

// Define the input type locally since it's not in the main schema
interface AddProductToGroupInput {
  user_id: string;
  product_id: number;
  group_id: number;
}

export const addProductToGroup = async (input: AddProductToGroupInput): Promise<UserFavoriteProductsGroup> => {
  try {
    // Verify that the favorite group exists and belongs to the user
    const group = await db.select()
      .from(favoriteGroupsTable)
      .where(
        and(
          eq(favoriteGroupsTable.id, input.group_id),
          eq(favoriteGroupsTable.user_id, input.user_id)
        )
      )
      .execute();

    if (group.length === 0) {
      throw new Error('Favorite group not found or does not belong to user');
    }

    // Verify that the product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (product.length === 0) {
      throw new Error('Product not found');
    }

    // Check if the product is already in the group (to handle duplicates gracefully)
    const existingEntry = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.user_id, input.user_id),
          eq(userFavoriteProductsGroupsTable.product_id, input.product_id),
          eq(userFavoriteProductsGroupsTable.group_id, input.group_id)
        )
      )
      .execute();

    if (existingEntry.length > 0) {
      // Product already exists in group, return existing entry
      const entry = existingEntry[0];
      return {
        ...entry,
        created_at: entry.created_at || new Date() // Handle nullable created_at
      };
    }

    // Add product to group
    const result = await db.insert(userFavoriteProductsGroupsTable)
      .values({
        user_id: input.user_id,
        product_id: input.product_id,
        group_id: input.group_id
      })
      .returning()
      .execute();

    const newEntry = result[0];
    return {
      ...newEntry,
      created_at: newEntry.created_at || new Date() // Handle nullable created_at
    };
  } catch (error) {
    console.error('Add product to group failed:', error);
    throw error;
  }
};
