
import { db } from '../db';
import { brandsTable } from '../db/schema';
import { type Brand } from '../schema';

export const getBrands = async (): Promise<Brand[]> => {
  try {
    const results = await db.select()
      .from(brandsTable)
      .orderBy(brandsTable.name)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    throw error;
  }
};
