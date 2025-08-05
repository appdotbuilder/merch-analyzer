
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable, productTypesTable, brandsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product by id with proper numeric conversions', async () => {
    // Create prerequisite data first
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(productTypesTable).values({
      id: 1,
      name: 'Standard T-shirt'
    }).execute();

    const brandResult = await db.insert(brandsTable).values({
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).returning().execute();

    // Create test product with numeric fields
    const productResult = await db.insert(productsTable).values({
      asin: 'TEST123',
      marketplace_id: 1,
      product_type_id: 1,
      brand_id: brandResult[0].id,
      title: 'Test Product',
      description_text: 'A test product',
      price: '29.99', // Insert as string for numeric column
      currency_code: 'USD',
      rating: '4.50', // Insert as string for numeric column
      reviews_count: 150,
      bsr: 1000,
      bsr_30_days_avg: 1200,
      bullet_points: ['Feature 1', 'Feature 2'],
      images: ['image1.jpg', 'image2.jpg'],
      product_url: 'https://example.com/product',
      published_at: '2024-01-15',
      discovery_query: 'test query',
      source_type: 'scraper',
      raw_data: { test: 'data' }
    }).returning().execute();

    const result = await getProductById(productResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productResult[0].id);
    expect(result!.asin).toEqual('TEST123');
    expect(result!.marketplace_id).toEqual(1);
    expect(result!.product_type_id).toEqual(1);
    expect(result!.brand_id).toEqual(brandResult[0].id);
    expect(result!.title).toEqual('Test Product');
    expect(result!.description_text).toEqual('A test product');
    
    // Verify numeric conversions
    expect(result!.price).toEqual(29.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.rating).toEqual(4.50);
    expect(typeof result!.rating).toBe('number');
    
    expect(result!.currency_code).toEqual('USD');
    expect(result!.reviews_count).toEqual(150);
    expect(result!.bsr).toEqual(1000);
    expect(result!.bsr_30_days_avg).toEqual(1200);
    expect(result!.bullet_points).toEqual(['Feature 1', 'Feature 2']);
    expect(result!.images).toEqual(['image1.jpg', 'image2.jpg']);
    expect(result!.product_url).toEqual('https://example.com/product');
    expect(result!.published_at).toEqual('2024-01-15');
    expect(result!.deleted).toEqual(false);
    expect(result!.status).toEqual('pending_enrichment');
    expect(result!.discovery_query).toEqual('test query');
    expect(result!.source_type).toEqual('scraper');
    expect(result!.raw_data).toEqual({ test: 'data' });
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.first_seen_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent product', async () => {
    const result = await getProductById(999999);
    expect(result).toBeNull();
  });

  it('should handle products with null numeric fields', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create product with null numeric fields
    const productResult = await db.insert(productsTable).values({
      asin: 'NULL_TEST',
      marketplace_id: 1,
      price: null, // Null numeric field
      rating: null, // Null numeric field
      reviews_count: null,
      bsr: null,
      bsr_30_days_avg: null
    }).returning().execute();

    const result = await getProductById(productResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.price).toBeNull();
    expect(result!.rating).toBeNull();
    expect(result!.reviews_count).toBeNull();
    expect(result!.bsr).toBeNull();
    expect(result!.bsr_30_days_avg).toBeNull();
    
    // Verify non-nullable fields have proper defaults
    expect(result!.currency_code).toEqual('USD');
    expect(result!.deleted).toEqual(false);
    expect(result!.status).toEqual('pending_enrichment');
    expect(result!.source_type).toEqual('scraper');
  });

  it('should handle products with minimal required fields', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 2,
      code: 'UK',
      name: 'United Kingdom'
    }).execute();

    // Create product with only required fields
    const productResult = await db.insert(productsTable).values({
      asin: 'MINIMAL_TEST',
      marketplace_id: 2
    }).returning().execute();

    const result = await getProductById(productResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('MINIMAL_TEST');
    expect(result!.marketplace_id).toEqual(2);
    expect(result!.product_type_id).toBeNull();
    expect(result!.brand_id).toBeNull();
    expect(result!.title).toBeNull();
    expect(result!.description_text).toBeNull();
    expect(result!.price).toBeNull();
    expect(result!.currency_code).toEqual('USD'); // Default value
    expect(result!.deleted).toEqual(false); // Default value
    expect(result!.status).toEqual('pending_enrichment'); // Default value
    expect(result!.source_type).toEqual('scraper'); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.first_seen_at).toBeInstanceOf(Date);
  });

  it('should verify type safety of returned fields', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const productResult = await db.insert(productsTable).values({
      asin: 'TYPE_TEST',
      marketplace_id: 1,
      price: '15.99',
      rating: '3.75'
    }).returning().execute();

    const result = await getProductById(productResult[0].id);

    expect(result).not.toBeNull();
    
    // Verify numeric type conversions
    expect(typeof result!.price).toBe('number');
    expect(typeof result!.rating).toBe('number');
    expect(typeof result!.currency_code).toBe('string');
    expect(typeof result!.deleted).toBe('boolean');
    expect(typeof result!.status).toBe('string');
    expect(typeof result!.source_type).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.first_seen_at).toBeInstanceOf(Date);
  });
});
