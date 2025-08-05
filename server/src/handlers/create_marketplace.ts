
import { db } from '../db';
import { marketplacesTable } from '../db/schema';
import { type Marketplace } from '../schema';

// Input type for creating marketplace
export interface CreateMarketplaceInput {
  id: number;
  code: 'US' | 'UK' | 'DE';
  name: string;
}

export const createMarketplace = async (input: CreateMarketplaceInput): Promise<Marketplace> => {
  try {
    const result = await db.insert(marketplacesTable)
      .values({
        id: input.id,
        code: input.code as 'US' | 'UK' | 'DE', // Type assertion to match enum
        name: input.name
      })
      .returning()
      .execute();

    return {
      id: result[0].id,
      code: result[0].code as 'US' | 'UK' | 'DE', // Type assertion for return value
      name: result[0].name
    };
  } catch (error) {
    console.error('Marketplace creation failed:', error);
    throw error;
  }
};
