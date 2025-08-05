
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable } from '../db/schema';
import { getProductByAsin } from '../handlers/get_product_by_asin';

// Test data setup
const testMarketplace = {
  id: 1,
  code: 'US' as const,
  name: 'United States'
};

const testProduct = {
  asin: 'TEST123456',
  marketplace_id: 1,
  title: 'Test Product',
  description_text: 'A test product description',
  price: '29.99', // Stored as string in DB
  currency_code: 'USD',
  rating: '4.50', // Stored as string in DB
  reviews_count: 100,
  bsr: 5000,
  bsr_30_days_avg: 4800,
  bullet_points: ['Feature 1', 'Feature 2'],
  images: ['image1.jpg', 'image2.jpg'],
  product_url: 'https://amazon.com/dp/TEST123456',
  published_at: '2024-01-15',
  deleted: false,
  status: 'active',
  discovery_query: 'test product',
  source_type: 'scraper',
  raw_data: { test: 'data' }
};

describe('getProductByAsin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product when found', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert test product
    await db.insert(productsTable)
      .values(testProduct)
      .execute();

    const result = await getProductByAsin('TEST123456');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('TEST123456');
    expect(result!.title).toEqual('Test Product');
    expect(result!.description_text).toEqual('A test product description');
    expect(result!.price).toEqual(29.99); // Should be converted to number
    expect(typeof result!.price).toEqual('number');
    expect(result!.currency_code).toEqual('USD');
    expect(result!.rating).toEqual(4.5); // Should be converted to number
    expect(typeof result!.rating).toEqual('number');
    expect(result!.reviews_count).toEqual(100);
    expect(result!.bsr).toEqual(5000);
    expect(result!.bsr_30_days_avg).toEqual(4800);
    expect(result!.bullet_points).toEqual(['Feature 1', 'Feature 2']);
    expect(result!.images).toEqual(['image1.jpg', 'image2.jpg']);
    expect(result!.product_url).toEqual('https://amazon.com/dp/TEST123456');
    expect(result!.published_at).toEqual('2024-01-15');
    expect(result!.deleted).toEqual(false);
    expect(result!.status).toEqual('active');
    expect(result!.discovery_query).toEqual('test product');
    expect(result!.source_type).toEqual('scraper');
    expect(result!.raw_data).toEqual({ test: 'data' });
    expect(result!.marketplace_id).toEqual(1);
    expect(result!.id).toBeDefined();
    expect(result!.first_seen_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product not found', async () => {
    const result = await getProductByAsin('NONEXISTENT');

    expect(result).toBeNull();
  });

  it('should handle products with null numeric fields', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert product with null price and rating
    const productWithNulls = {
      asin: 'NULLTEST123',
      marketplace_id: 1,
      title: 'Product with Nulls',
      price: null,
      rating: null
    };

    await db.insert(productsTable)
      .values(productWithNulls)
      .execute();

    const result = await getProductByAsin('NULLTEST123');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('NULLTEST123');
    expect(result!.price).toBeNull();
    expect(result!.rating).toBeNull();
  });

  it('should apply defaults for null fields with schema defaults', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert minimal product to test defaults
    const minimalProduct = {
      asin: 'MINIMAL123',
      marketplace_id: 1,
      currency_code: null, // Should default to USD
      deleted: null, // Should default to false
      source_type: null // Should default to scraper
    };

    await db.insert(productsTable)
      .values(minimalProduct)
      .execute();

    const result = await getProductByAsin('MINIMAL123');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('MINIMAL123');
    expect(result!.currency_code).toEqual('USD'); // Should apply default
    expect(result!.deleted).toEqual(false); // Should apply default
    expect(result!.source_type).toEqual('scraper'); // Should apply default
    expect(result!.first_seen_at).toBeInstanceOf(Date); // Should have default date
    expect(result!.created_at).toBeInstanceOf(Date); // Should have default date
    expect(result!.updated_at).toBeInstanceOf(Date); // Should have default date
  });

  it('should find product with exact ASIN match', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert multiple products with similar ASINs
    await db.insert(productsTable)
      .values([
        { ...testProduct, asin: 'SIMILAR123' },
        { ...testProduct, asin: 'SIMILAR124' },
        { ...testProduct, asin: 'EXACT456' }
      ])
      .execute();

    const result = await getProductByAsin('EXACT456');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('EXACT456');
  });

  it('should handle products with empty arrays', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert product with empty arrays
    const productWithEmptyArrays = {
      asin: 'EMPTY123',
      marketplace_id: 1,
      title: 'Product with Empty Arrays',
      bullet_points: [],
      images: []
    };

    await db.insert(productsTable)
      .values(productWithEmptyArrays)
      .execute();

    const result = await getProductByAsin('EMPTY123');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('EMPTY123');
    expect(result!.bullet_points).toEqual([]);
    expect(result!.images).toEqual([]);
  });

  it('should handle products with null raw_data', async () => {
    // Insert test marketplace first
    await db.insert(marketplacesTable)
      .values(testMarketplace)
      .execute();

    // Insert product with null raw_data
    const productWithNullRawData = {
      asin: 'NULLRAW123',
      marketplace_id: 1,
      title: 'Product with Null Raw Data',
      raw_data: null
    };

    await db.insert(productsTable)
      .values(productWithNullRawData)
      .execute();

    const result = await getProductByAsin('NULLRAW123');

    expect(result).not.toBeNull();
    expect(result!.asin).toEqual('NULLRAW123');
    expect(result!.raw_data).toBeNull();
  });
});
