
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { excludedBrandsTable, brandsTable, profilesTable } from '../db/schema';
import { addExcludedBrand } from '../handlers/add_excluded_brand';
import { eq } from 'drizzle-orm';

// Define types inline since they're missing from schema
type AddExcludedBrandInput = {
  user_id: string;
  brand_id: number;
};

const testUserId = '123e4567-e89b-12d3-a456-426614174000';
const invalidUserId = '999e4567-e89b-12d3-a456-426614174999';

describe('addExcludedBrand', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const setupTestData = async () => {
    // Create test user
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create test brand
    await db.insert(brandsTable)
      .values({
        name: 'Test Brand',
        normalized_name: 'test brand'
      })
      .execute();

    // Get the created brand id
    const brands = await db.select()
      .from(brandsTable)
      .where(eq(brandsTable.name, 'Test Brand'))
      .execute();
    
    return brands[0].id;
  };

  it('should add excluded brand successfully', async () => {
    const brandId = await setupTestData();
    
    const testInput: AddExcludedBrandInput = {
      user_id: testUserId,
      brand_id: brandId
    };

    const result = await addExcludedBrand(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.brand_id).toEqual(brandId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save excluded brand to database', async () => {
    const brandId = await setupTestData();
    
    const testInput: AddExcludedBrandInput = {
      user_id: testUserId,
      brand_id: brandId
    };

    const result = await addExcludedBrand(testInput);

    const excludedBrands = await db.select()
      .from(excludedBrandsTable)
      .where(eq(excludedBrandsTable.id, result.id))
      .execute();

    expect(excludedBrands).toHaveLength(1);
    expect(excludedBrands[0].user_id).toEqual(testUserId);
    expect(excludedBrands[0].brand_id).toEqual(brandId);
    expect(excludedBrands[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const brandId = await setupTestData();

    const invalidInput: AddExcludedBrandInput = {
      user_id: invalidUserId,
      brand_id: brandId
    };

    await expect(addExcludedBrand(invalidInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when brand does not exist', async () => {
    await setupTestData();

    const invalidInput: AddExcludedBrandInput = {
      user_id: testUserId,
      brand_id: 9999
    };

    await expect(addExcludedBrand(invalidInput)).rejects.toThrow(/brand not found/i);
  });

  it('should handle duplicate excluded brand constraint', async () => {
    const brandId = await setupTestData();
    
    const testInput: AddExcludedBrandInput = {
      user_id: testUserId,
      brand_id: brandId
    };

    // Add excluded brand first time
    await addExcludedBrand(testInput);

    // Try to add the same excluded brand again
    await expect(addExcludedBrand(testInput)).rejects.toThrow(/already excluded/i);
  });
});
