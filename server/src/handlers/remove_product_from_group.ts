
import { db } from '../db';
import { userFavoriteProductsGroupsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeProductFromGroup(groupId: number, productId: number): Promise<boolean> {
  try {
    // Delete the relationship record
    const result = await db.delete(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.group_id, groupId),
          eq(userFavoriteProductsGroupsTable.product_id, productId)
        )
      )
      .execute();

    // Return true if a record was deleted, false if no matching record was found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Failed to remove product from group:', error);
    throw error;
  }
}
