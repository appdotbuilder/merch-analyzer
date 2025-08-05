
import { db } from '../db';
import { productTypesTable } from '../db/schema';
import { type ProductType } from '../schema';

export const getProductTypes = async (): Promise<ProductType[]> => {
  try {
    const results = await db.select()
      .from(productTypesTable)
      .orderBy(productTypesTable.id)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch product types:', error);
    throw error;
  }
};
