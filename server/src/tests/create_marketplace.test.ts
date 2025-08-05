
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable } from '../db/schema';
import { createMarketplace, type CreateMarketplaceInput } from '../handlers/create_marketplace';
import { eq } from 'drizzle-orm';

const testInput: CreateMarketplaceInput = {
  id: 4,
  code: 'US',
  name: 'United States Test'
};

describe('createMarketplace', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a marketplace', async () => {
    const result = await createMarketplace(testInput);

    expect(result.id).toEqual(4);
    expect(result.code).toEqual('US');
    expect(result.name).toEqual('United States Test');
  });

  it('should save marketplace to database', async () => {
    const result = await createMarketplace(testInput);

    const marketplaces = await db.select()
      .from(marketplacesTable)
      .where(eq(marketplacesTable.id, result.id))
      .execute();

    expect(marketplaces).toHaveLength(1);
    expect(marketplaces[0].id).toEqual(4);
    expect(marketplaces[0].code).toEqual('US');
    expect(marketplaces[0].name).toEqual('United States Test');
  });

  it('should handle different marketplace codes', async () => {
    const ukInput: CreateMarketplaceInput = {
      id: 5,
      code: 'UK',
      name: 'United Kingdom Test'
    };

    const result = await createMarketplace(ukInput);

    expect(result.code).toEqual('UK');
    expect(result.name).toEqual('United Kingdom Test');

    const marketplaces = await db.select()
      .from(marketplacesTable)
      .where(eq(marketplacesTable.id, result.id))
      .execute();

    expect(marketplaces[0].code).toEqual('UK');
  });

  it('should enforce unique constraint on code', async () => {
    // Create first marketplace
    await createMarketplace(testInput);

    // Try to create another with same code but different id
    const duplicateInput: CreateMarketplaceInput = {
      id: 6,
      code: 'US',
      name: 'Another US Marketplace'
    };

    await expect(createMarketplace(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should enforce unique constraint on id', async () => {
    // Create first marketplace
    await createMarketplace(testInput);

    // Try to create another with same id but different code
    const duplicateInput: CreateMarketplaceInput = {
      id: 4,
      code: 'UK',
      name: 'UK Marketplace'
    };

    await expect(createMarketplace(duplicateInput)).rejects.toThrow(/unique|duplicate/i);
  });
});
