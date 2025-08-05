
import { db } from '../db';
import { productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    // Soft delete by setting deleted = true
    const result = await db.update(productsTable)
      .set({ 
        deleted: true,
        updated_at: new Date()
      })
      .where(eq(productsTable.id, id))
      .returning({ id: productsTable.id })
      .execute();

    // Return true if a product was found and updated, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};
