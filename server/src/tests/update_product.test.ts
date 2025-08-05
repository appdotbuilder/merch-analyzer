
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable, productTypesTable, brandsTable } from '../db/schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Define the update input schema inline to match handler
const updateProductInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  description_text: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  currency_code: z.string().optional(),
  rating: z.number().nullable().optional(),
  reviews_count: z.number().int().optional(),
  bsr: z.number().int().optional(),
  bsr_30_days_avg: z.number().int().optional(),
  bullet_points: z.array(z.string()).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  product_url: z.string().optional(),
  published_at: z.string().optional(),
  status: z.string().optional(),
  discovery_query: z.string().nullable().optional(),
  source_type: z.string().optional(),
  raw_data: z.record(z.any()).nullable().optional(),
  last_scraped_at: z.coerce.date().optional()
});

type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

describe('updateProduct', () => {
  let testProductId: number;
  let testMarketplaceId: number;
  let testProductTypeId: number;
  let testBrandId: number;

  beforeEach(async () => {
    await createDB();

    // Create prerequisite data
    const marketplaceResult = await db.insert(marketplacesTable)
      .values({ id: 1, code: 'US', name: 'United States' })
      .returning()
      .execute();
    testMarketplaceId = marketplaceResult[0].id;

    const productTypeResult = await db.insert(productTypesTable)
      .values({ id: 1, name: 'Standard T-shirt' })
      .returning()
      .execute();
    testProductTypeId = productTypeResult[0].id;

    // Provide both name and normalized_name for brand insertion
    const brandResult = await db.insert(brandsTable)
      .values({ 
        name: 'Test Brand',
        normalized_name: 'test brand'
      })
      .returning()
      .execute();
    testBrandId = brandResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: testMarketplaceId,
        product_type_id: testProductTypeId,
        brand_id: testBrandId,
        title: 'Original Title',
        description_text: 'Original description',
        price: '19.99',
        currency_code: 'USD',
        rating: '4.5',
        reviews_count: 100,
        bsr: 1000,
        bsr_30_days_avg: 1200,
        bullet_points: ['Original point 1', 'Original point 2'],
        images: ['image1.jpg', 'image2.jpg'],
        product_url: 'https://original-url.com',
        published_at: '2024-01-01',
        status: 'pending_enrichment',
        discovery_query: 'original query',
        source_type: 'scraper',
        raw_data: { original: 'data' }
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;
  });

  afterEach(resetDB);

  it('should update basic product fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      title: 'Updated Title',
      description_text: 'Updated description',
      price: 29.99,
      currency_code: 'EUR',
      rating: 4.8,
      reviews_count: 150,
      bsr: 800,
      bsr_30_days_avg: 900
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toBe(testProductId);
    expect(result.title).toBe('Updated Title');
    expect(result.description_text).toBe('Updated description');
    expect(result.price).toBe(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.currency_code).toBe('EUR');
    expect(result.rating).toBe(4.8);
    expect(typeof result.rating).toBe('number');
    expect(result.reviews_count).toBe(150);
    expect(result.bsr).toBe(800);
    expect(result.bsr_30_days_avg).toBe(900);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update array fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      bullet_points: ['Updated point 1', 'Updated point 2', 'New point 3'],
      images: ['new-image1.jpg', 'new-image2.jpg']
    };

    const result = await updateProduct(updateInput);

    expect(result.bullet_points).toEqual(['Updated point 1', 'Updated point 2', 'New point 3']);
    expect(result.images).toEqual(['new-image1.jpg', 'new-image2.jpg']);
  });

  it('should update status and metadata fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      status: 'enriched',
      discovery_query: 'updated search query',
      source_type: 'manual',
      raw_data: { updated: 'metadata', version: 2 },
      last_scraped_at: new Date('2024-02-01T10:00:00Z')
    };

    const result = await updateProduct(updateInput);

    expect(result.status).toBe('enriched');
    expect(result.discovery_query).toBe('updated search query');
    expect(result.source_type).toBe('manual');
    expect(result.raw_data).toEqual({ updated: 'metadata', version: 2 });
    expect(result.last_scraped_at).toEqual(new Date('2024-02-01T10:00:00Z'));
  });

  it('should handle nullable price and rating', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      price: null,
      rating: null
    };

    const result = await updateProduct(updateInput);

    expect(result.price).toBeNull();
    expect(result.rating).toBeNull();
  });

  it('should handle null array fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      bullet_points: null,
      images: null,
      description_text: null,
      discovery_query: null,
      raw_data: null
    };

    const result = await updateProduct(updateInput);

    expect(result.bullet_points).toBeNull();
    expect(result.images).toBeNull();
    expect(result.description_text).toBeNull();
    expect(result.discovery_query).toBeNull();
    expect(result.raw_data).toBeNull();
  });

  it('should persist changes in database', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      title: 'Database Test Title',
      price: 39.99,
      status: 'enriched'
    };

    await updateProduct(updateInput);

    // Verify changes were persisted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, testProductId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].title).toBe('Database Test Title');
    expect(parseFloat(products[0].price!)).toBe(39.99);
    expect(products[0].status).toBe('enriched');
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only update provided fields', async () => {
    const updateInput: UpdateProductInput = {
      id: testProductId,
      title: 'Partial Update Title'
    };

    const result = await updateProduct(updateInput);

    expect(result.title).toBe('Partial Update Title');
    expect(result.description_text).toBe('Original description');
    expect(result.price).toBe(19.99);
    expect(result.currency_code).toBe('USD');
    expect(result.rating).toBe(4.5);
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      title: 'Non-existent Product'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/Product with id 99999 not found/i);
  });
});
