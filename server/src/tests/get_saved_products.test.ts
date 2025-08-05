
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable, marketplacesTable, productsTable, savedProductsTable } from '../db/schema';
import { getSavedProducts } from '../handlers/get_saved_products';

const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const testUserId2 = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
const nonExistentUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d481';

describe('getSavedProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no saved products', async () => {
    // Create user profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getSavedProducts(testUserId);
    
    expect(result).toEqual([]);
  });

  it('should return saved products for a user', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create marketplace (required for products)
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create products
    const productResults = await db.insert(productsTable).values([
      {
        asin: 'TEST123',
        marketplace_id: 1,
        title: 'Test Product 1',
        price: '19.99'
      },
      {
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Test Product 2',
        price: '29.99'
      }
    ]).returning().execute();

    // Save products for user
    await db.insert(savedProductsTable).values([
      {
        user_id: testUserId,
        product_id: productResults[0].id
      },
      {
        user_id: testUserId,
        product_id: productResults[1].id
      }
    ]).execute();

    const result = await getSavedProducts(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].product_id).toEqual(productResults[0].id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].user_id).toEqual(testUserId);
    expect(result[1].product_id).toEqual(productResults[1].id);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should only return saved products for the specified user', async () => {
    // Create two user profiles
    await db.insert(profilesTable).values([
      {
        user_id: testUserId,
        email: 'test1@example.com',
        full_name: 'Test User 1'
      },
      {
        user_id: testUserId2,
        email: 'test2@example.com',
        full_name: 'Test User 2'
      }
    ]).execute();

    // Create marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create products
    const productResults = await db.insert(productsTable).values([
      {
        asin: 'TEST123',
        marketplace_id: 1,
        title: 'Test Product 1'
      },
      {
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Test Product 2'
      }
    ]).returning().execute();

    // Save different products for each user
    await db.insert(savedProductsTable).values([
      {
        user_id: testUserId,
        product_id: productResults[0].id
      },
      {
        user_id: testUserId2,
        product_id: productResults[1].id
      }
    ]).execute();

    const resultUser1 = await getSavedProducts(testUserId);
    const resultUser2 = await getSavedProducts(testUserId2);

    expect(resultUser1).toHaveLength(1);
    expect(resultUser1[0].user_id).toEqual(testUserId);
    expect(resultUser1[0].product_id).toEqual(productResults[0].id);

    expect(resultUser2).toHaveLength(1);
    expect(resultUser2[0].user_id).toEqual(testUserId2);
    expect(resultUser2[0].product_id).toEqual(productResults[1].id);
  });

  it('should handle user with non-existent saved products gracefully', async () => {
    // Use a properly formatted UUID that doesn't exist in the database
    const result = await getSavedProducts(nonExistentUserId);
    
    expect(result).toEqual([]);
  });
});
