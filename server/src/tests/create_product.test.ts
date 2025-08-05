
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable, productTypesTable, brandsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateProductInput = {
  asin: 'B08N5WRWNW',
  marketplace_id: 1,
  product_type_id: 1,
  brand_id: 1,
  title: 'Test Product',
  description_text: 'A product for testing',
  price: 19.99,
  currency_code: 'USD',
  rating: 4.5,
  reviews_count: 100,
  bsr: 5000,
  bsr_30_days_avg: 4800,
  bullet_points: ['Feature 1', 'Feature 2'],
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  product_url: 'https://amazon.com/dp/B08N5WRWNW',
  published_at: '2024-01-15',
  discovery_query: 'test query',
  source_type: 'scraper',
  raw_data: { source: 'test' }
};

describe('createProduct', () => {
  beforeEach(async () => {
    await createDB();
    
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
  });

  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.asin).toEqual('B08N5WRWNW');
    expect(result.marketplace_id).toEqual(1);
    expect(result.product_type_id).toEqual(1);
    expect(result.brand_id).toEqual(1);
    expect(result.title).toEqual('Test Product');
    expect(result.description_text).toEqual('A product for testing');
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number');
    expect(result.currency_code).toEqual('USD');
    expect(result.rating).toEqual(4.5);
    expect(typeof result.rating).toEqual('number');
    expect(result.reviews_count).toEqual(100);
    expect(result.bsr).toEqual(5000);
    expect(result.bsr_30_days_avg).toEqual(4800);
    expect(result.bullet_points).toEqual(['Feature 1', 'Feature 2']);
    expect(result.images).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.product_url).toEqual('https://amazon.com/dp/B08N5WRWNW');
    expect(result.published_at).toEqual('2024-01-15');
    expect(result.deleted).toEqual(false);
    expect(result.status).toEqual('pending_enrichment');
    expect(result.discovery_query).toEqual('test query');
    expect(result.source_type).toEqual('scraper');
    expect(result.raw_data).toEqual({ source: 'test' });
    expect(result.id).toBeDefined();
    expect(result.first_seen_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.asin).toEqual('B08N5WRWNW');
    expect(savedProduct.marketplace_id).toEqual(1);
    expect(savedProduct.title).toEqual('Test Product');
    expect(parseFloat(savedProduct.price!)).toEqual(19.99);
    expect(parseFloat(savedProduct.rating!)).toEqual(4.5);
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should create product with minimal required fields', async () => {
    const minimalInput: CreateProductInput = {
      asin: 'B08MINIMAL',
      marketplace_id: 1,
      currency_code: 'USD',
      source_type: 'scraper'
    };

    const result = await createProduct(minimalInput);

    expect(result.asin).toEqual('B08MINIMAL');
    expect(result.marketplace_id).toEqual(1);
    expect(result.product_type_id).toBeNull();
    expect(result.brand_id).toBeNull();
    expect(result.title).toBeNull();
    expect(result.price).toBeNull();
    expect(result.currency_code).toEqual('USD');
    expect(result.source_type).toEqual('scraper');
    expect(result.deleted).toEqual(false);
    expect(result.status).toEqual('pending_enrichment');
    expect(result.id).toBeDefined();
    expect(result.first_seen_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null numeric values correctly', async () => {
    const inputWithNulls: CreateProductInput = {
      asin: 'B08NULLS',
      marketplace_id: 1,
      currency_code: 'USD',
      source_type: 'scraper',
      price: undefined,
      rating: undefined
    };

    const result = await createProduct(inputWithNulls);

    expect(result.price).toBeNull();
    expect(result.rating).toBeNull();
    expect(result.asin).toEqual('B08NULLS');
    expect(typeof result.currency_code).toEqual('string');
    expect(typeof result.source_type).toEqual('string');
  });

  it('should enforce ASIN uniqueness constraint', async () => {
    // Create first product
    await createProduct(testInput);

    // Try to create second product with same ASIN
    const duplicateInput: CreateProductInput = {
      ...testInput,
      title: 'Different Title'
    };

    expect(createProduct(duplicateInput)).rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should enforce foreign key constraints', async () => {
    const invalidInput: CreateProductInput = {
      asin: 'B08INVALID',
      marketplace_id: 999, // Non-existent marketplace
      currency_code: 'USD',
      source_type: 'scraper'
    };

    expect(createProduct(invalidInput)).rejects.toThrow(/violates foreign key constraint|FOREIGN KEY constraint failed/i);
  });

  it('should apply default values correctly', async () => {
    const inputWithDefaults: CreateProductInput = {
      asin: 'B08DEFAULTS',
      marketplace_id: 1,
      currency_code: 'USD', // Required field - must be provided
      source_type: 'scraper' // Required field - must be provided
    };

    const result = await createProduct(inputWithDefaults);

    expect(result.currency_code).toEqual('USD');
    expect(result.source_type).toEqual('scraper');
    expect(result.deleted).toEqual(false);
    expect(result.status).toEqual('pending_enrichment');
  });
});
