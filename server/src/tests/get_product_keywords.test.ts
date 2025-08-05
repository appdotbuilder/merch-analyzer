
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productKeywordsTable, marketplacesTable } from '../db/schema';
import { getProductKeywords } from '../handlers/get_product_keywords';

describe('getProductKeywords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return keywords for a product', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create product
    const productResult = await db.insert(productsTable).values({
      asin: 'TEST123',
      marketplace_id: 1,
      title: 'Test Product'
    }).returning().execute();

    const productId = productResult[0].id;

    // Create keywords for the product
    await db.insert(productKeywordsTable).values([
      { product_id: productId, keyword: 'test keyword 1' },
      { product_id: productId, keyword: 'test keyword 2' },
      { product_id: productId, keyword: 'test keyword 3' }
    ]).execute();

    const result = await getProductKeywords(productId);

    expect(result).toHaveLength(3);
    expect(result[0].product_id).toEqual(productId);
    expect(result[0].keyword).toEqual('test keyword 1');
    expect(result[1].keyword).toEqual('test keyword 2');
    expect(result[2].keyword).toEqual('test keyword 3');
    expect(result[0].id).toBeDefined();
  });

  it('should return empty array when product has no keywords', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create product without keywords
    const productResult = await db.insert(productsTable).values({
      asin: 'TEST456',
      marketplace_id: 1,
      title: 'Product Without Keywords'
    }).returning().execute();

    const productId = productResult[0].id;

    const result = await getProductKeywords(productId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent product', async () => {
    const nonExistentProductId = 99999;

    const result = await getProductKeywords(nonExistentProductId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return keywords for specified product', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create two products
    const product1Result = await db.insert(productsTable).values({
      asin: 'PROD1',
      marketplace_id: 1,
      title: 'Product 1'
    }).returning().execute();

    const product2Result = await db.insert(productsTable).values({
      asin: 'PROD2',
      marketplace_id: 1,
      title: 'Product 2'
    }).returning().execute();

    const product1Id = product1Result[0].id;
    const product2Id = product2Result[0].id;

    // Create keywords for both products
    await db.insert(productKeywordsTable).values([
      { product_id: product1Id, keyword: 'product 1 keyword' },
      { product_id: product2Id, keyword: 'product 2 keyword' },
      { product_id: product2Id, keyword: 'another product 2 keyword' }
    ]).execute();

    const result = await getProductKeywords(product1Id);

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(product1Id);
    expect(result[0].keyword).toEqual('product 1 keyword');
  });
});
