
import { db } from '../db';
import { brandsTable } from '../db/schema';
import { type Brand } from '../schema';

export const createBrand = async (name: string): Promise<Brand> => {
  try {
    const result = await db.insert(brandsTable)
      .values({
        name: name,
        normalized_name: name.toLowerCase().trim()
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Brand creation failed:', error);
    throw error;
  }
};
