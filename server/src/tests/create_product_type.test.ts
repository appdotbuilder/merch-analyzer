
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productTypesTable } from '../db/schema';
import { createProductType, type CreateProductTypeInput } from '../handlers/create_product_type';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductTypeInput = {
  name: 'Test Product Type'
};

describe('createProductType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product type', async () => {
    const result = await createProductType(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product Type');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should save product type to database', async () => {
    const result = await createProductType(testInput);

    // Query using proper drizzle syntax
    const productTypes = await db.select()
      .from(productTypesTable)
      .where(eq(productTypesTable.id, result.id))
      .execute();

    expect(productTypes).toHaveLength(1);
    expect(productTypes[0].name).toEqual('Test Product Type');
    expect(productTypes[0].id).toEqual(result.id);
  });

  it('should enforce unique name constraint', async () => {
    // Create first product type
    await createProductType(testInput);

    // Try to create duplicate - should throw error
    await expect(createProductType(testInput))
      .rejects.toThrow(/unique/i);
  });

  it('should handle different product type names', async () => {
    const productType1 = await createProductType({ name: 'Standard T-shirt' });
    const productType2 = await createProductType({ name: 'Premium T-shirt' });

    expect(productType1.name).toEqual('Standard T-shirt');
    expect(productType2.name).toEqual('Premium T-shirt');
    expect(productType1.id).not.toEqual(productType2.id);

    // Verify both are in database
    const allProductTypes = await db.select()
      .from(productTypesTable)
      .execute();

    expect(allProductTypes).toHaveLength(2);
    const names = allProductTypes.map(pt => pt.name);
    expect(names).toContain('Standard T-shirt');
    expect(names).toContain('Premium T-shirt');
  });

  it('should assign incremental IDs', async () => {
    const productType1 = await createProductType({ name: 'Type 1' });
    const productType2 = await createProductType({ name: 'Type 2' });
    const productType3 = await createProductType({ name: 'Type 3' });

    // IDs should be incremental
    expect(productType2.id).toBeGreaterThan(productType1.id);
    expect(productType3.id).toBeGreaterThan(productType2.id);
  });
});
