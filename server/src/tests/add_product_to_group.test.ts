
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  marketplacesTable, 
  productsTable, 
  profilesTable, 
  favoriteGroupsTable, 
  userFavoriteProductsGroupsTable 
} from '../db/schema';
import { addProductToGroup } from '../handlers/add_product_to_group';
import { eq, and } from 'drizzle-orm';

// Define the input type locally since it's not in the main schema
interface AddProductToGroupInput {
  user_id: string;
  product_id: number;
  group_id: number;
}

const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const testInput: AddProductToGroupInput = {
  user_id: testUserId,
  product_id: 1,
  group_id: 1
};

describe('addProductToGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test user profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create test marketplace (required for product)
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    await db.insert(productsTable)
      .values({
        id: 1,
        asin: 'TEST123',
        marketplace_id: 1
      })
      .execute();

    // Create test favorite group
    await db.insert(favoriteGroupsTable)
      .values({
        id: 1,
        user_id: testUserId,
        name: 'Test Group'
      })
      .execute();
  });

  it('should add product to group successfully', async () => {
    const result = await addProductToGroup(testInput);

    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(1);
    expect(result.group_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save product-group relationship to database', async () => {
    const result = await addProductToGroup(testInput);

    const entries = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(eq(userFavoriteProductsGroupsTable.id, result.id))
      .execute();

    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toEqual(testUserId);
    expect(entries[0].product_id).toEqual(1);
    expect(entries[0].group_id).toEqual(1);
    // Note: created_at from DB might be nullable, so we check the handler result
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate additions gracefully', async () => {
    // Add product to group first time
    const firstResult = await addProductToGroup(testInput);

    // Add same product to same group again
    const secondResult = await addProductToGroup(testInput);

    // Should return the existing entry
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.user_id).toEqual(testUserId);
    expect(secondResult.product_id).toEqual(1);
    expect(secondResult.group_id).toEqual(1);
    expect(secondResult.created_at).toBeInstanceOf(Date);

    // Verify only one entry exists in database
    const entries = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.user_id, testUserId),
          eq(userFavoriteProductsGroupsTable.product_id, 1),
          eq(userFavoriteProductsGroupsTable.group_id, 1)
        )
      )
      .execute();

    expect(entries).toHaveLength(1);
  });

  it('should throw error when group does not exist', async () => {
    const invalidInput = {
      ...testInput,
      group_id: 999
    };

    expect(addProductToGroup(invalidInput)).rejects.toThrow(/favorite group not found/i);
  });

  it('should throw error when group does not belong to user', async () => {
    // Create group for different user
    const otherUserId = 'a47ac10b-58cc-4372-a567-0e02b2c3d479';
    await db.insert(profilesTable)
      .values({
        user_id: otherUserId,
        email: 'other@example.com',
        full_name: 'Other User'
      })
      .execute();

    await db.insert(favoriteGroupsTable)
      .values({
        id: 2,
        user_id: otherUserId,
        name: 'Other Group'
      })
      .execute();

    const invalidInput = {
      ...testInput,
      group_id: 2
    };

    expect(addProductToGroup(invalidInput)).rejects.toThrow(/favorite group not found/i);
  });

  it('should throw error when product does not exist', async () => {
    const invalidInput = {
      ...testInput,
      product_id: 999
    };

    expect(addProductToGroup(invalidInput)).rejects.toThrow(/product not found/i);
  });

  it('should work with multiple products in same group', async () => {
    // Create second product
    await db.insert(productsTable)
      .values({
        id: 2,
        asin: 'TEST456',
        marketplace_id: 1
      })
      .execute();

    // Add first product to group
    const firstResult = await addProductToGroup(testInput);

    // Add second product to same group
    const secondInput = {
      ...testInput,
      product_id: 2
    };
    const secondResult = await addProductToGroup(secondInput);

    // Both should be successful with different IDs
    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.product_id).toEqual(1);
    expect(secondResult.product_id).toEqual(2);
    expect(firstResult.group_id).toEqual(secondResult.group_id);
    expect(firstResult.created_at).toBeInstanceOf(Date);
    expect(secondResult.created_at).toBeInstanceOf(Date);

    // Verify both entries exist in database
    const entries = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.user_id, testUserId),
          eq(userFavoriteProductsGroupsTable.group_id, 1)
        )
      )
      .execute();

    expect(entries).toHaveLength(2);
  });
});
