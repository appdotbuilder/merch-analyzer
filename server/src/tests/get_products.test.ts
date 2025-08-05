
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productTypesTable, brandsTable, productsTable } from '../db/schema';
import { type GetProductsInput } from '../schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no products exist', async () => {
    const input: GetProductsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);
    expect(result).toEqual([]);
  });

  it('should return products with correct data types', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(productTypesTable).values({
      id: 1,
      name: 'Standard T-shirt'
    }).execute();

    await db.insert(brandsTable).values({
      id: 1,
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).execute();

    // Create test product
    await db.insert(productsTable).values({
      asin: 'TEST123',
      marketplace_id: 1,
      product_type_id: 1,
      brand_id: 1,
      title: 'Test Product',
      price: '29.99',
      rating: '4.50',
      reviews_count: 100,
      bsr: 1000,
      currency_code: 'USD'
    }).execute();

    const input: GetProductsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    const product = result[0];

    // Verify data types
    expect(typeof product.id).toBe('number');
    expect(typeof product.asin).toBe('string');
    expect(typeof product.marketplace_id).toBe('number');
    expect(typeof product.product_type_id).toBe('number');
    expect(typeof product.brand_id).toBe('number');
    expect(typeof product.title).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(typeof product.rating).toBe('number');
    expect(typeof product.reviews_count).toBe('number');
    expect(typeof product.bsr).toBe('number');
    expect(typeof product.currency_code).toBe('string');
    expect(typeof product.deleted).toBe('boolean');
    expect(typeof product.status).toBe('string');
    expect(typeof product.source_type).toBe('string');
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
    expect(product.first_seen_at).toBeInstanceOf(Date);

    // Verify values
    expect(product.asin).toEqual('TEST123');
    expect(product.price).toEqual(29.99);
    expect(product.rating).toEqual(4.5);
    expect(product.reviews_count).toEqual(100);
    expect(product.bsr).toEqual(1000);
    expect(product.currency_code).toEqual('USD');
    expect(product.deleted).toEqual(false);
    expect(product.status).toEqual('pending_enrichment');
    expect(product.source_type).toEqual('scraper');
  });

  it('should filter by marketplace_id', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values([
      { id: 1, code: 'US', name: 'United States' },
      { id: 2, code: 'UK', name: 'United Kingdom' }
    ]).execute();

    // Create products in different marketplaces
    await db.insert(productsTable).values([
      {
        asin: 'US123',
        marketplace_id: 1,
        title: 'US Product'
      },
      {
        asin: 'UK123',
        marketplace_id: 2,
        title: 'UK Product'
      }
    ]).execute();

    const input: GetProductsInput = {
      marketplace_id: 1,
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].asin).toEqual('US123');
    expect(result[0].marketplace_id).toEqual(1);
  });

  it('should filter by product_type_id', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(productTypesTable).values([
      { id: 1, name: 'Standard T-shirt' },
      { id: 2, name: 'Premium T-shirt' }
    ]).execute();

    // Create products with different types
    await db.insert(productsTable).values([
      {
        asin: 'STANDARD123',
        marketplace_id: 1,
        product_type_id: 1,
        title: 'Standard Product'
      },
      {
        asin: 'PREMIUM123',
        marketplace_id: 1,
        product_type_id: 2,
        title: 'Premium Product'
      }
    ]).execute();

    const input: GetProductsInput = {
      product_type_id: 2,
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].asin).toEqual('PREMIUM123');
    expect(result[0].product_type_id).toEqual(2);
  });

  it('should filter by brand_id', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(brandsTable).values([
      { id: 1, name: 'Brand A', normalized_name: 'brand a' },
      { id: 2, name: 'Brand B', normalized_name: 'brand b' }
    ]).execute();

    // Create products with different brands
    await db.insert(productsTable).values([
      {
        asin: 'BRANDA123',
        marketplace_id: 1,
        brand_id: 1,
        title: 'Brand A Product'
      },
      {
        asin: 'BRANDB123',
        marketplace_id: 1,
        brand_id: 2,
        title: 'Brand B Product'
      }
    ]).execute();

    const input: GetProductsInput = {
      brand_id: 1,
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].asin).toEqual('BRANDA123');
    expect(result[0].brand_id).toEqual(1);
  });

  it('should apply multiple filters', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(productTypesTable).values({
      id: 1,
      name: 'Standard T-shirt'
    }).execute();

    await db.insert(brandsTable).values({
      id: 1,
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).execute();

    // Create products with different combinations
    await db.insert(productsTable).values([
      {
        asin: 'MATCH123',
        marketplace_id: 1,
        product_type_id: 1,
        brand_id: 1,
        title: 'Matching Product'
      },
      {
        asin: 'NOMATCH123',
        marketplace_id: 1,
        product_type_id: 1,
        brand_id: null, // Different brand_id
        title: 'Non-matching Product'
      }
    ]).execute();

    const input: GetProductsInput = {
      marketplace_id: 1,
      product_type_id: 1,
      brand_id: 1,
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    expect(result[0].asin).toEqual('MATCH123');
  });

  it('should handle pagination correctly', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create multiple products
    const products = Array.from({ length: 5 }, (_, i) => ({
      asin: `TEST${i + 1}`,
      marketplace_id: 1,
      title: `Product ${i + 1}`
    }));

    await db.insert(productsTable).values(products).execute();

    // Test limit
    const limitInput: GetProductsInput = {
      limit: 2,
      offset: 0
    };

    const limitResult = await getProducts(limitInput);
    expect(limitResult).toHaveLength(2);

    // Test offset
    const offsetInput: GetProductsInput = {
      limit: 2,
      offset: 2
    };

    const offsetResult = await getProducts(offsetInput);
    expect(offsetResult).toHaveLength(2);

    // Verify different products returned
    expect(limitResult[0].id).not.toEqual(offsetResult[0].id);
  });

  it('should handle null numeric values correctly', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create product with null numeric values
    await db.insert(productsTable).values({
      asin: 'NULLTEST123',
      marketplace_id: 1,
      title: 'Product with nulls',
      price: null,
      rating: null,
      reviews_count: null,
      bsr: null
    }).execute();

    const input: GetProductsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    const product = result[0];

    // Verify null values are preserved
    expect(product.price).toBeNull();
    expect(product.rating).toBeNull();
    expect(product.reviews_count).toBeNull();
    expect(product.bsr).toBeNull();

    // Verify non-nullable fields have defaults
    expect(product.currency_code).toEqual('USD');
    expect(product.deleted).toEqual(false);
    expect(product.status).toEqual('pending_enrichment');
    expect(product.source_type).toEqual('scraper');
  });

  it('should handle default values correctly', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create minimal product to test defaults
    await db.insert(productsTable).values({
      asin: 'DEFAULTS123',
      marketplace_id: 1
    }).execute();

    const input: GetProductsInput = {
      limit: 20,
      offset: 0
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(1);
    const product = result[0];

    // Verify defaults are applied
    expect(product.currency_code).toEqual('USD');
    expect(product.deleted).toEqual(false);
    expect(product.status).toEqual('pending_enrichment');
    expect(product.source_type).toEqual('scraper');
    expect(product.first_seen_at).toBeInstanceOf(Date);
    expect(product.created_at).toBeInstanceOf(Date);
    expect(product.updated_at).toBeInstanceOf(Date);
  });
});
