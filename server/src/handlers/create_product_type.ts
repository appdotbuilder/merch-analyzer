
import { db } from '../db';
import { productTypesTable } from '../db/schema';
import { type ProductType } from '../schema';

export interface CreateProductTypeInput {
  name: string;
}

export const createProductType = async (input: CreateProductTypeInput): Promise<ProductType> => {
  try {
    // Get the next available ID by finding the max ID
    const maxIdResult = await db.select()
      .from(productTypesTable)
      .orderBy(productTypesTable.id)
      .execute();
    
    const nextId = maxIdResult.length > 0 
      ? Math.max(...maxIdResult.map(pt => pt.id)) + 1 
      : 1;

    // Insert product type record with explicit ID
    const result = await db.insert(productTypesTable)
      .values({
        id: nextId,
        name: input.name
      })
      .returning()
      .execute();

    const productType = result[0];
    return {
      id: productType.id,
      name: productType.name
    };
  } catch (error) {
    console.error('Product type creation failed:', error);
    throw error;
  }
};
