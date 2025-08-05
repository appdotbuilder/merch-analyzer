
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productsTable, bsrHistoryTable } from '../db/schema';
import { recordBsrHistory } from '../handlers/record_bsr_history';
import { eq } from 'drizzle-orm';

describe('recordBsrHistory', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create required marketplace data
    await db.insert(marketplacesTable)
      .values([
        { id: 1, code: 'US', name: 'United States' },
        { id: 2, code: 'UK', name: 'United Kingdom' },
        { id: 3, code: 'DE', name: 'Germany' }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should record BSR history for existing product', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1, // US marketplace
        title: 'Test Product',
        bsr: 1000
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const testBsr = 1500;

    const result = await recordBsrHistory(productId, testBsr);

    // Verify returned data
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(productId);
    expect(result.bsr).toEqual(testBsr);
    expect(result.date).toBeDefined();
    expect(typeof result.date).toBe('string');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });

  it('should save BSR history to database', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Another Test Product',
        bsr: 2000
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const testBsr = 2500;

    const result = await recordBsrHistory(productId, testBsr);

    // Query database to verify record was saved
    const bsrHistory = await db.select()
      .from(bsrHistoryTable)
      .where(eq(bsrHistoryTable.id, result.id))
      .execute();

    expect(bsrHistory).toHaveLength(1);
    expect(bsrHistory[0].product_id).toEqual(productId);
    expect(bsrHistory[0].bsr).toEqual(testBsr);
    expect(bsrHistory[0].date).toBeDefined();
    expect(typeof bsrHistory[0].date).toBe('string');
  });

  it('should use current date for BSR history record', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: 1,
        title: 'Date Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const testBsr = 3000;

    const result = await recordBsrHistory(productId, testBsr);

    // Verify date is today's date
    const today = new Date().toISOString().split('T')[0];
    expect(result.date).toEqual(today);
  });

  it('should throw error for non-existent product', async () => {
    const nonExistentProductId = 99999;
    const testBsr = 1500;

    await expect(recordBsrHistory(nonExistentProductId, testBsr))
      .rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should handle zero BSR value', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TESTZERO',
        marketplace_id: 1,
        title: 'Zero BSR Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const zeroBsr = 0;

    const result = await recordBsrHistory(productId, zeroBsr);

    expect(result.bsr).toEqual(0);
    expect(result.product_id).toEqual(productId);
  });

  it('should record multiple BSR entries for same product', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TESTMULTI',
        marketplace_id: 1,
        title: 'Multiple BSR Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record first BSR entry
    const result1 = await recordBsrHistory(productId, 1000);
    
    // Record second BSR entry
    const result2 = await recordBsrHistory(productId, 1200);

    // Verify both records exist
    const allBsrHistory = await db.select()
      .from(bsrHistoryTable)
      .where(eq(bsrHistoryTable.product_id, productId))
      .execute();

    expect(allBsrHistory).toHaveLength(2);
    expect(allBsrHistory.map(h => h.bsr)).toContain(1000);
    expect(allBsrHistory.map(h => h.bsr)).toContain(1200);
  });
});
