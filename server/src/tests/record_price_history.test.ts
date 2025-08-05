
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, priceHistoryTable, marketplacesTable } from '../db/schema';
import { recordPriceHistory } from '../handlers/record_price_history';
import { eq } from 'drizzle-orm';

describe('recordPriceHistory', () => {
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

  it('should record price history for existing product', async () => {
    // Create test product first
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1, // US marketplace
        title: 'Test Product',
        price: '25.99',
        currency_code: 'USD'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record price history
    const result = await recordPriceHistory(productId, 29.99, 'USD');

    // Validate returned data
    expect(result.product_id).toEqual(productId);
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.currency_code).toEqual('USD');
    expect(result.date).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it('should save price history to database', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Another Test Product',
        price: '15.50',
        currency_code: 'USD'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record price history
    const result = await recordPriceHistory(productId, 18.75, 'USD');

    // Query database to verify record was saved
    const priceHistories = await db.select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.id, result.id))
      .execute();

    expect(priceHistories).toHaveLength(1);
    expect(priceHistories[0].product_id).toEqual(productId);
    expect(parseFloat(priceHistories[0].price!)).toEqual(18.75);
    expect(priceHistories[0].currency_code).toEqual('USD');
    expect(priceHistories[0].date).toBeDefined();
  });

  it('should use current date for price history record', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: 1,
        title: 'Date Test Product',
        price: '12.99',
        currency_code: 'USD'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const todayString = new Date().toISOString().split('T')[0];

    // Record price history
    const result = await recordPriceHistory(productId, 14.99, 'USD');

    // Verify date is today
    expect(result.date).toEqual(todayString);
  });

  it('should handle different currencies', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TESTEUR123',
        marketplace_id: 3, // DE marketplace
        title: 'Euro Product',
        price: '22.50',
        currency_code: 'EUR'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record price history in EUR
    const result = await recordPriceHistory(productId, 25.00, 'EUR');

    expect(result.price).toEqual(25.00);
    expect(result.currency_code).toEqual('EUR');
  });

  it('should throw error for non-existent product', async () => {
    const nonExistentProductId = 99999;

    await expect(recordPriceHistory(nonExistentProductId, 19.99, 'USD'))
      .rejects.toThrow(/Product not found/i);
  });

  it('should handle zero price correctly', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TESTZERO',
        marketplace_id: 1,
        title: 'Zero Price Product',
        currency_code: 'USD'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Record zero price
    const result = await recordPriceHistory(productId, 0, 'USD');

    expect(result.price).toEqual(0);
    expect(typeof result.price).toBe('number');
  });
});
