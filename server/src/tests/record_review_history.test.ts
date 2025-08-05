
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, reviewHistoryTable, marketplacesTable } from '../db/schema';
import { recordReviewHistory } from '../handlers/record_review_history';
import { eq } from 'drizzle-orm';

describe('recordReviewHistory', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values([
        { id: 1, code: 'US', name: 'United States' },
        { id: 2, code: 'UK', name: 'United Kingdom' },
        { id: 3, code: 'DE', name: 'Germany' }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should record review history for existing product', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1,
        title: 'Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record review history
    const result = await recordReviewHistory(productId, 4.5, 150);

    // Verify returned data
    expect(result.product_id).toEqual(productId);
    expect(result.rating).toEqual(4.5);
    expect(result.reviews_count).toEqual(150);
    expect(result.date).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.rating).toBe('number');
  });

  it('should save review history to database', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Another Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record review history
    const result = await recordReviewHistory(productId, 3.8, 75);

    // Query database to verify record was saved
    const reviewHistory = await db.select()
      .from(reviewHistoryTable)
      .where(eq(reviewHistoryTable.id, result.id))
      .execute();

    expect(reviewHistory).toHaveLength(1);
    expect(reviewHistory[0].product_id).toEqual(productId);
    expect(parseFloat(reviewHistory[0].rating!)).toEqual(3.8);
    expect(reviewHistory[0].reviews_count).toEqual(75);
    expect(reviewHistory[0].date).toBeDefined();
  });

  it('should use current date for review history record', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: 1,
        title: 'Date Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const today = new Date().toISOString().split('T')[0];

    // Record review history
    const result = await recordReviewHistory(productId, 4.2, 200);

    // Verify date is today
    expect(result.date).toEqual(today);
  });

  it('should handle zero rating correctly', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST101',
        marketplace_id: 1,
        title: 'Zero Rating Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test with 0 rating (which should be stored as 0, not null)
    const result = await recordReviewHistory(productId, 0, 10);

    expect(result.rating).toEqual(0);
    expect(typeof result.rating).toBe('number');
  });

  it('should throw error when product does not exist', async () => {
    const nonExistentProductId = 99999;

    await expect(recordReviewHistory(nonExistentProductId, 4.0, 100))
      .rejects.toThrow(/Product with id 99999 not found/i);
  });

  it('should handle decimal ratings correctly', async () => {
    // Create a test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST202',
        marketplace_id: 2,
        title: 'Decimal Rating Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test with precise decimal rating
    const result = await recordReviewHistory(productId, 4.73, 328);

    expect(result.rating).toEqual(4.73);
    expect(result.reviews_count).toEqual(328);
    expect(typeof result.rating).toBe('number');
  });
});
