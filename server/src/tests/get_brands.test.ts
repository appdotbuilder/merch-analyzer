
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { brandsTable } from '../db/schema';
import { getBrands } from '../handlers/get_brands';

describe('getBrands', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no brands exist', async () => {
    const result = await getBrands();
    expect(result).toEqual([]);
  });

  it('should return all brands ordered by name', async () => {
    // Insert test brands with normalized_name
    await db.insert(brandsTable)
      .values([
        { name: 'Zebra Brand', normalized_name: 'zebra brand' },
        { name: 'Apple Inc', normalized_name: 'apple inc' },
        { name: 'Microsoft', normalized_name: 'microsoft' }
      ])
      .execute();

    const result = await getBrands();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Apple Inc');
    expect(result[1].name).toEqual('Microsoft');
    expect(result[2].name).toEqual('Zebra Brand');

    // Verify all required fields are present
    result.forEach(brand => {
      expect(brand.id).toBeDefined();
      expect(typeof brand.id).toBe('number');
      expect(brand.name).toBeDefined();
      expect(typeof brand.name).toBe('string');
      expect(brand.normalized_name).toBeDefined();
      expect(typeof brand.normalized_name).toBe('string');
    });
  });

  it('should return brands with normalized names', async () => {
    await db.insert(brandsTable)
      .values([
        { name: '  UPPERCASE BRAND  ', normalized_name: 'uppercase brand' },
        { name: 'MixedCase Brand', normalized_name: 'mixedcase brand' }
      ])
      .execute();

    const result = await getBrands();

    expect(result).toHaveLength(2);
    
    const mixedCaseBrand = result.find(b => b.name === 'MixedCase Brand');
    expect(mixedCaseBrand?.normalized_name).toEqual('mixedcase brand');

    const upperBrand = result.find(b => b.name === '  UPPERCASE BRAND  ');
    expect(upperBrand?.normalized_name).toEqual('uppercase brand');
  });

  it('should handle single brand correctly', async () => {
    await db.insert(brandsTable)
      .values({ name: 'Single Brand', normalized_name: 'single brand' })
      .execute();

    const result = await getBrands();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Single Brand');
    expect(result[0].normalized_name).toEqual('single brand');
    expect(result[0].id).toBeDefined();
  });
});
