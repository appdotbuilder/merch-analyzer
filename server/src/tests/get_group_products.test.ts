
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  productsTable, 
  marketplacesTable, 
  profilesTable, 
  favoriteGroupsTable, 
  userFavoriteProductsGroupsTable 
} from '../db/schema';
import { getGroupProducts } from '../handlers/get_group_products';

describe('getGroupProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return products in a favorite group ordered by added_at descending', async () => {
    // Create marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create profile
    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    await db.insert(profilesTable).values({
      user_id: userId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create favorite group
    const groupResult = await db.insert(favoriteGroupsTable).values({
      user_id: userId,
      name: 'Test Group'
    }).returning().execute();
    const groupId = groupResult[0].id;

    // Create products
    const product1Result = await db.insert(productsTable).values({
      asin: 'B001',
      marketplace_id: 1,
      title: 'First Product',
      price: '19.99',
      rating: '4.5'
    }).returning().execute();

    const product2Result = await db.insert(productsTable).values({
      asin: 'B002',
      marketplace_id: 1,
      title: 'Second Product',
      price: '29.99',
      rating: '4.0'
    }).returning().execute();

    const product3Result = await db.insert(productsTable).values({
      asin: 'B003',
      marketplace_id: 1,
      title: 'Third Product',
      price: '39.99',
      rating: '3.5'
    }).returning().execute();

    // Add products to group with different timestamps
    await db.insert(userFavoriteProductsGroupsTable).values({
      user_id: userId,
      product_id: product1Result[0].id,
      group_id: groupId
    }).execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(userFavoriteProductsGroupsTable).values({
      user_id: userId,
      product_id: product2Result[0].id,
      group_id: groupId
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(userFavoriteProductsGroupsTable).values({
      user_id: userId,
      product_id: product3Result[0].id,
      group_id: groupId
    }).execute();

    const results = await getGroupProducts(groupId);

    // Should return all 3 products
    expect(results).toHaveLength(3);

    // Verify first product (most recently added)
    expect(results[0].asin).toEqual('B003');
    expect(results[0].title).toEqual('Third Product');
    expect(results[0].price).toEqual(39.99);
    expect(results[0].rating).toEqual(3.5);
    expect(typeof results[0].price).toBe('number');
    expect(typeof results[0].rating).toBe('number');

    // Verify ordering (most recently added first)
    expect(results[0].asin).toEqual('B003');
    expect(results[1].asin).toEqual('B002');
    expect(results[2].asin).toEqual('B001');

    // Verify all required fields are present and have correct types
    results.forEach(product => {
      expect(product.id).toBeDefined();
      expect(product.asin).toBeDefined();
      expect(product.marketplace_id).toEqual(1);
      expect(product.currency_code).toEqual('USD');
      expect(product.deleted).toEqual(false);
      expect(product.status).toEqual('pending_enrichment');
      expect(product.source_type).toEqual('scraper');
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
      expect(product.first_seen_at).toBeInstanceOf(Date);
      expect(typeof product.currency_code).toBe('string');
      expect(typeof product.deleted).toBe('boolean');
      expect(typeof product.status).toBe('string');
      expect(typeof product.source_type).toBe('string');
    });
  });

  it('should return empty array for non-existent group', async () => {
    const results = await getGroupProducts(999);
    expect(results).toHaveLength(0);
  });

  it('should return empty array for group with no products', async () => {
    // Create marketplace and user
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    await db.insert(profilesTable).values({
      user_id: userId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create empty group
    const groupResult = await db.insert(favoriteGroupsTable).values({
      user_id: userId,
      name: 'Empty Group'
    }).returning().execute();

    const results = await getGroupProducts(groupResult[0].id);
    expect(results).toHaveLength(0);
  });

  it('should handle products with null numeric fields and apply defaults', async () => {
    // Create marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create profile
    const userId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    await db.insert(profilesTable).values({
      user_id: userId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create favorite group
    const groupResult = await db.insert(favoriteGroupsTable).values({
      user_id: userId,
      name: 'Test Group'
    }).returning().execute();
    const groupId = groupResult[0].id;

    // Create product with null price and rating
    const productResult = await db.insert(productsTable).values({
      asin: 'B001',
      marketplace_id: 1,
      title: 'Product with nulls',
      price: null,
      rating: null,
      currency_code: null, // This should default to USD
      source_type: null, // This should default to scraper
      deleted: null // This should default to false
    }).returning().execute();

    // Add product to group
    await db.insert(userFavoriteProductsGroupsTable).values({
      user_id: userId,
      product_id: productResult[0].id,
      group_id: groupId
    }).execute();

    const results = await getGroupProducts(groupId);

    expect(results).toHaveLength(1);
    expect(results[0].price).toBeNull();
    expect(results[0].rating).toBeNull();
    expect(results[0].title).toEqual('Product with nulls');
    
    // Verify defaults are applied
    expect(results[0].currency_code).toEqual('USD');
    expect(results[0].source_type).toEqual('scraper');
    expect(results[0].deleted).toEqual(false);
    expect(results[0].first_seen_at).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });
});
