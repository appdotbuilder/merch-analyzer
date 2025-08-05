
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable } from '../db/schema';
import { getMarketplaces } from '../handlers/get_marketplaces';

describe('getMarketplaces', () => {
  beforeEach(async () => {
    await createDB();
    
    // Seed marketplace data since migration might not include INSERT statements
    await db.insert(marketplacesTable)
      .values([
        { id: 1, code: 'US', name: 'United States' },
        { id: 2, code: 'UK', name: 'United Kingdom' },
        { id: 3, code: 'DE', name: 'Germany' }
      ])
      .onConflictDoNothing()
      .execute();
  });
  
  afterEach(resetDB);

  it('should return all marketplaces', async () => {
    const result = await getMarketplaces();

    expect(result).toHaveLength(3);
    
    // Check that all expected marketplaces are present
    const codes = result.map(m => m.code);
    expect(codes).toContain('US');
    expect(codes).toContain('UK');
    expect(codes).toContain('DE');
    
    // Check that names are present
    const names = result.map(m => m.name);
    expect(names).toContain('United States');
    expect(names).toContain('United Kingdom');
    expect(names).toContain('Germany');
  });

  it('should return marketplaces with correct structure', async () => {
    const result = await getMarketplaces();

    result.forEach(marketplace => {
      expect(marketplace.id).toBeDefined();
      expect(typeof marketplace.id).toBe('number');
      expect(marketplace.code).toBeDefined();
      expect(typeof marketplace.code).toBe('string');
      expect(marketplace.name).toBeDefined();
      expect(typeof marketplace.name).toBe('string');
      expect(['US', 'UK', 'DE']).toContain(marketplace.code);
    });
  });

  it('should return marketplaces in consistent order', async () => {
    const result1 = await getMarketplaces();
    const result2 = await getMarketplaces();

    expect(result1).toHaveLength(result2.length);
    
    // Sort by id to ensure consistent comparison
    const sorted1 = result1.sort((a, b) => a.id - b.id);
    const sorted2 = result2.sort((a, b) => a.id - b.id);
    
    expect(sorted1).toEqual(sorted2);
  });
});
