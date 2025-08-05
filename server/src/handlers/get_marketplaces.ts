
import { db } from '../db';
import { marketplacesTable } from '../db/schema';
import { type Marketplace } from '../schema';

export const getMarketplaces = async (): Promise<Marketplace[]> => {
  try {
    const results = await db.select()
      .from(marketplacesTable)
      .execute();

    // Type assertion is safe because the database constraint ensures only 'US', 'UK', 'DE' values
    return results as Marketplace[];
  } catch (error) {
    console.error('Failed to fetch marketplaces:', error);
    throw error;
  }
};
