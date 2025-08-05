
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productsTable, dailyProductStatsTable } from '../db/schema';
import { getDailyProductStats } from '../handlers/get_daily_product_stats';

describe('getDailyProductStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return daily product stats for a product', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST-ASIN-123',
        marketplace_id: 1,
        title: 'Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test daily stats
    await db.insert(dailyProductStatsTable)
      .values([
        {
          product_id: productId,
          date: '2024-01-01',
          avg_bsr_7: 1000,
          avg_bsr_30: 1500,
          avg_bsr_90: 2000
        },
        {
          product_id: productId,
          date: '2024-01-02',
          avg_bsr_7: 900,
          avg_bsr_30: 1400,
          avg_bsr_90: 1900
        }
      ])
      .execute();

    const result = await getDailyProductStats(productId);

    expect(result).toHaveLength(2);
    
    // Results should be ordered by date descending
    expect(result[0].date).toEqual('2024-01-02');
    expect(result[0].avg_bsr_7).toEqual(900);
    expect(result[0].avg_bsr_30).toEqual(1400);
    expect(result[0].avg_bsr_90).toEqual(1900);
    expect(result[0].product_id).toEqual(productId);
    expect(result[0].id).toBeDefined();

    expect(result[1].date).toEqual('2024-01-01');
    expect(result[1].avg_bsr_7).toEqual(1000);
    expect(result[1].avg_bsr_30).toEqual(1500);
    expect(result[1].avg_bsr_90).toEqual(2000);
  });

  it('should return empty array for product with no stats', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST-ASIN-456',
        marketplace_id: 1,
        title: 'Test Product Without Stats'
      })
      .returning()
      .execute();

    const result = await getDailyProductStats(productResult[0].id);

    expect(result).toHaveLength(0);
  });

  it('should handle stats with null values', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST-ASIN-789',
        marketplace_id: 1,
        title: 'Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create stats with null values
    await db.insert(dailyProductStatsTable)
      .values({
        product_id: productId,
        date: '2024-01-01',
        avg_bsr_7: null,
        avg_bsr_30: 1500,
        avg_bsr_90: null
      })
      .execute();

    const result = await getDailyProductStats(productId);

    expect(result).toHaveLength(1);
    expect(result[0].avg_bsr_7).toBeNull();
    expect(result[0].avg_bsr_30).toEqual(1500);
    expect(result[0].avg_bsr_90).toBeNull();
    expect(result[0].date).toEqual('2024-01-01');
  });

  it('should return stats ordered by date descending', async () => {
    // Create prerequisite marketplace
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST-ASIN-ORDER',
        marketplace_id: 1,
        title: 'Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create stats in random order
    await db.insert(dailyProductStatsTable)
      .values([
        {
          product_id: productId,
          date: '2024-01-03',
          avg_bsr_7: 800
        },
        {
          product_id: productId,
          date: '2024-01-01',
          avg_bsr_7: 1000
        },
        {
          product_id: productId,
          date: '2024-01-02',
          avg_bsr_7: 900
        }
      ])
      .execute();

    const result = await getDailyProductStats(productId);

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual('2024-01-03');
    expect(result[1].date).toEqual('2024-01-02');
    expect(result[2].date).toEqual('2024-01-01');
  });
});
