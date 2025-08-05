
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable } from '../db/schema';
import { createScrapingLog } from '../handlers/create_scraping_log';

// Temporary types until schema is updated
type CreateScrapingLogInput = {
  phase: 'discovery' | 'enrichment';
  product_id?: number;
  asin?: string;
  marketplace: 'US' | 'UK' | 'DE';
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  scraped_at: Date;
};

describe('createScrapingLog', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a scraping log without product_id', async () => {
    const testInput: CreateScrapingLogInput = {
      phase: 'discovery',
      asin: 'B07ABC123',
      marketplace: 'US',
      status: 'success',
      scraped_at: new Date()
    };

    const result = await createScrapingLog(testInput);

    // Basic field validation
    expect(result.phase).toEqual('discovery');
    expect(result.asin).toEqual('B07ABC123');
    expect(result.marketplace).toEqual('US');
    expect(result.status).toEqual('success');
    expect(result.product_id).toBeNull();
    expect(result.error_message).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.scraped_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a scraping log with product_id', async () => {
    // Create marketplace first (US marketplace should have id=1 from migration)
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .onConflictDoNothing()
      .execute();

    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'B07ABC123',
        marketplace_id: 1, // US marketplace
        first_seen_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const product = productResult[0];

    const testInput: CreateScrapingLogInput = {
      phase: 'enrichment',
      product_id: product.id,
      asin: 'B07ABC123',
      marketplace: 'US',
      status: 'success',
      scraped_at: new Date()
    };

    const result = await createScrapingLog(testInput);

    expect(result.phase).toEqual('enrichment');
    expect(result.product_id).toEqual(product.id);
    expect(result.asin).toEqual('B07ABC123');
    expect(result.marketplace).toEqual('US');
    expect(result.status).toEqual('success');
  });

  it('should create a scraping log with error message', async () => {
    const testInput: CreateScrapingLogInput = {
      phase: 'discovery',
      asin: 'B07INVALID',
      marketplace: 'UK',
      status: 'failed',
      error_message: 'Product not found on marketplace',
      scraped_at: new Date()
    };

    const result = await createScrapingLog(testInput);

    expect(result.phase).toEqual('discovery');
    expect(result.status).toEqual('failed');
    expect(result.error_message).toEqual('Product not found on marketplace');
  });

  it('should handle different marketplaces', async () => {
    const testInput: CreateScrapingLogInput = {
      phase: 'discovery',
      asin: 'B07TEST123',
      marketplace: 'DE',
      status: 'pending',
      scraped_at: new Date()
    };

    const result = await createScrapingLog(testInput);

    expect(result.marketplace).toEqual('DE');
    expect(result.status).toEqual('pending');
    expect(result.scraped_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle enrichment phase logs', async () => {
    const testInput: CreateScrapingLogInput = {
      phase: 'enrichment',
      asin: 'B07ENRICH1',
      marketplace: 'US',
      status: 'success',
      scraped_at: new Date()
    };

    const result = await createScrapingLog(testInput);

    expect(result.phase).toEqual('enrichment');
    expect(result.asin).toEqual('B07ENRICH1');
    expect(result.status).toEqual('success');
  });
});
