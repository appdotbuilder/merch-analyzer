
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  profilesTable, 
  favoriteGroupsTable, 
  productsTable, 
  userFavoriteProductsGroupsTable,
  marketplacesTable
} from '../db/schema';
import { removeProductFromGroup } from '../handlers/remove_product_from_group';
import { eq, and } from 'drizzle-orm';

describe('removeProductFromGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove product from group successfully', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test user
    const [user] = await db.insert(profilesTable)
      .values({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test favorite group
    const [group] = await db.insert(favoriteGroupsTable)
      .values({
        user_id: user.user_id,
        name: 'Test Group'
      })
      .returning()
      .execute();

    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1
      })
      .returning()
      .execute();

    // Add product to group
    await db.insert(userFavoriteProductsGroupsTable)
      .values({
        user_id: user.user_id,
        product_id: product.id,
        group_id: group.id
      })
      .execute();

    // Remove product from group
    const result = await removeProductFromGroup(group.id, product.id);

    expect(result).toBe(true);

    // Verify the record was deleted
    const remaining = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.group_id, group.id),
          eq(userFavoriteProductsGroupsTable.product_id, product.id)
        )
      )
      .execute();

    expect(remaining).toHaveLength(0);
  });

  it('should return false when product is not in group', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test user
    const [user] = await db.insert(profilesTable)
      .values({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test favorite group
    const [group] = await db.insert(favoriteGroupsTable)
      .values({
        user_id: user.user_id,
        name: 'Test Group'
      })
      .returning()
      .execute();

    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1
      })
      .returning()
      .execute();

    // Try to remove product that was never added to group
    const result = await removeProductFromGroup(group.id, product.id);

    expect(result).toBe(false);
  });

  it('should return false for non-existent group', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1
      })
      .returning()
      .execute();

    // Try to remove product from non-existent group
    const result = await removeProductFromGroup(99999, product.id);

    expect(result).toBe(false);
  });

  it('should return false for non-existent product', async () => {
    // Create test user
    const [user] = await db.insert(profilesTable)
      .values({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create test favorite group
    const [group] = await db.insert(favoriteGroupsTable)
      .values({
        user_id: user.user_id,
        name: 'Test Group'
      })
      .returning()
      .execute();

    // Try to remove non-existent product from group
    const result = await removeProductFromGroup(group.id, 99999);

    expect(result).toBe(false);
  });

  it('should only remove specific product-group relationship', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test user
    const [user] = await db.insert(profilesTable)
      .values({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .returning()
      .execute();

    // Create two test groups
    const [group1] = await db.insert(favoriteGroupsTable)
      .values({
        user_id: user.user_id,
        name: 'Test Group 1'
      })
      .returning()
      .execute();

    const [group2] = await db.insert(favoriteGroupsTable)
      .values({
        user_id: user.user_id,
        name: 'Test Group 2'
      })
      .returning()
      .execute();

    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1
      })
      .returning()
      .execute();

    // Add product to both groups
    await db.insert(userFavoriteProductsGroupsTable)
      .values([
        {
          user_id: user.user_id,
          product_id: product.id,
          group_id: group1.id
        },
        {
          user_id: user.user_id,
          product_id: product.id,
          group_id: group2.id
        }
      ])
      .execute();

    // Remove product from group1 only
    const result = await removeProductFromGroup(group1.id, product.id);

    expect(result).toBe(true);

    // Verify product is removed from group1
    const group1Records = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.group_id, group1.id),
          eq(userFavoriteProductsGroupsTable.product_id, product.id)
        )
      )
      .execute();

    expect(group1Records).toHaveLength(0);

    // Verify product is still in group2
    const group2Records = await db.select()
      .from(userFavoriteProductsGroupsTable)
      .where(
        and(
          eq(userFavoriteProductsGroupsTable.group_id, group2.id),
          eq(userFavoriteProductsGroupsTable.product_id, product.id)
        )
      )
      .execute();

    expect(group2Records).toHaveLength(1);
  });
});
