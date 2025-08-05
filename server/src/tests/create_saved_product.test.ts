
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { savedProductsTable, productsTable, profilesTable, marketplacesTable } from '../db/schema';
import { createSavedProduct } from '../handlers/create_saved_product';
import { eq } from 'drizzle-orm';

// Define the input type inline since it's missing from schema.ts
type CreateSavedProductInput = {
  user_id: string;
  product_id: number;
};

describe('createSavedProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testUserId = 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d';
  let testProductId: number;

  beforeEach(async () => {
    // Create test marketplace first (prerequisite for product)
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test user profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'B01234TEST',
        marketplace_id: 1,
        title: 'Test Product',
        price: '19.99'
      })
      .returning()
      .execute();

    testProductId = productResult[0].id;
  });

  const testInput: CreateSavedProductInput = {
    user_id: testUserId,
    product_id: 0 // Will be set in each test
  };

  it('should create a saved product', async () => {
    const input = { ...testInput, product_id: testProductId };
    const result = await createSavedProduct(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save the saved product to database', async () => {
    const input = { ...testInput, product_id: testProductId };
    const result = await createSavedProduct(input);

    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, result.id))
      .execute();

    expect(savedProducts).toHaveLength(1);
    expect(savedProducts[0].user_id).toEqual(testUserId);
    expect(savedProducts[0].product_id).toEqual(testProductId);
    expect(savedProducts[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const input = { ...testInput, product_id: 99999 };

    expect(createSavedProduct(input)).rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should throw error when user profile does not exist', async () => {
    const nonExistentUserId = 'a1b2c3d4-5e6f-7a8b-9c0d-e1f2a3b4c5d6';
    const input = { user_id: nonExistentUserId, product_id: testProductId };

    expect(createSavedProduct(input)).rejects.toThrow(/User profile with id .+ not found/i);
  });

  it('should allow multiple saved products for same user', async () => {
    const input = { ...testInput, product_id: testProductId };
    
    // Create first saved product
    const result1 = await createSavedProduct(input);
    
    // Create second saved product (same user, same product - should be allowed)
    const result2 = await createSavedProduct(input);
    
    // Verify both were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.product_id).toEqual(testProductId);
    expect(result2.product_id).toEqual(testProductId);

    // Verify both exist in database
    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.user_id, testUserId))
      .execute();

    expect(savedProducts).toHaveLength(2);
  });
});
