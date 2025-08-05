
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productTypesTable } from '../db/schema';
import { getProductTypes } from '../handlers/get_product_types';

describe('getProductTypes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all product types ordered by id', async () => {
    // Insert test product types
    await db.insert(productTypesTable).values([
      { id: 1, name: 'Standard T-shirt' },
      { id: 3, name: 'Hoodie' },
      { id: 2, name: 'Premium T-shirt' }
    ]).execute();

    const result = await getProductTypes();

    // Verify we get the expected product types
    expect(result.length).toBe(3);
    
    // Check structure of first result
    const firstType = result[0];
    expect(firstType.id).toBeDefined();
    expect(typeof firstType.id).toBe('number');
    expect(firstType.name).toBeDefined();
    expect(typeof firstType.name).toBe('string');

    // Verify ordering by id
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);

    // Verify names match expected values
    expect(result[0].name).toBe('Standard T-shirt');
    expect(result[1].name).toBe('Premium T-shirt');
    expect(result[2].name).toBe('Hoodie');
  });

  it('should return empty array when no product types exist', async () => {
    const result = await getProductTypes();

    expect(result).toEqual([]);
  });

  it('should return correct data types for all fields', async () => {
    // Insert a test product type
    await db.insert(productTypesTable).values({
      id: 1,
      name: 'Test Product Type'
    }).execute();

    const result = await getProductTypes();

    expect(result.length).toBe(1);
    const productType = result[0];
    
    expect(typeof productType.id).toBe('number');
    expect(Number.isInteger(productType.id)).toBe(true);
    expect(typeof productType.name).toBe('string');
    expect(productType.name.length).toBeGreaterThan(0);
    expect(productType.name).toBe('Test Product Type');
  });
});
