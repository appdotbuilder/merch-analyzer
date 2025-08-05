
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productsTable, reviewHistoryTable } from '../db/schema';
import { getReviewHistory } from '../handlers/get_review_history';

describe('getReviewHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return review history for a product', async () => {
    // Create test marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: marketplace[0].id
      })
      .returning()
      .execute();

    // Create test review history records
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    await db.insert(reviewHistoryTable)
      .values([
        {
          product_id: product[0].id,
          date: today,
          reviews_count: 150,
          rating: '4.5' // Convert to string for numeric column
        },
        {
          product_id: product[0].id,
          date: yesterdayString,
          reviews_count: 148,
          rating: '4.4' // Convert to string for numeric column
        }
      ])
      .execute();

    const result = await getReviewHistory(product[0].id);

    expect(result).toHaveLength(2);
    
    // Should be ordered by date descending (most recent first)
    expect(result[0].date).toEqual(today);
    expect(result[0].reviews_count).toEqual(150);
    expect(result[0].rating).toEqual(4.5);
    expect(typeof result[0].rating).toBe('number');
    
    expect(result[1].date).toEqual(yesterdayString);
    expect(result[1].reviews_count).toEqual(148);
    expect(result[1].rating).toEqual(4.4);
  });

  it('should return empty array for product with no review history', async () => {
    // Create test marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: marketplace[0].id
      })
      .returning()
      .execute();

    const result = await getReviewHistory(product[0].id);

    expect(result).toHaveLength(0);
  });

  it('should filter by days parameter', async () => {
    // Create test marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: marketplace[0].id
      })
      .returning()
      .execute();

    // Create review history records - some recent, some old
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(today.getDate() - 10);

    await db.insert(reviewHistoryTable)
      .values([
        {
          product_id: product[0].id,
          date: today.toISOString().split('T')[0],
          reviews_count: 150,
          rating: '4.5' // Convert to string for numeric column
        },
        {
          product_id: product[0].id,
          date: twoDaysAgo.toISOString().split('T')[0],
          reviews_count: 148,
          rating: '4.4' // Convert to string for numeric column
        },
        {
          product_id: product[0].id,
          date: tenDaysAgo.toISOString().split('T')[0],
          reviews_count: 140,
          rating: '4.2' // Convert to string for numeric column
        }
      ])
      .execute();

    // Test with 5 days filter - should exclude the 10-day-old record
    const result = await getReviewHistory(product[0].id, 5);

    expect(result).toHaveLength(2);
    expect(result[0].reviews_count).toEqual(150);
    expect(result[1].reviews_count).toEqual(148);
    
    // The 10-day-old record should not be included
    expect(result.find(r => r.reviews_count === 140)).toBeUndefined();
  });

  it('should handle null rating values', async () => {
    // Create test marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TESTNULL',
        marketplace_id: marketplace[0].id
      })
      .returning()
      .execute();

    // Create review history with null rating
    const today = new Date().toISOString().split('T')[0];
    await db.insert(reviewHistoryTable)
      .values({
        product_id: product[0].id,
        date: today,
        reviews_count: 100,
        rating: null
      })
      .execute();

    const result = await getReviewHistory(product[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].rating).toBeNull();
    expect(result[0].reviews_count).toEqual(100);
  });

  it('should return results ordered by date descending', async () => {
    // Create test marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create test product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TESTORDER',
        marketplace_id: marketplace[0].id
      })
      .returning()
      .execute();

    // Create review history records in random order
    const dates = [
      '2024-01-01',
      '2024-01-15',
      '2024-01-10',
      '2024-01-05'
    ];

    await db.insert(reviewHistoryTable)
      .values(dates.map((date, index) => ({
        product_id: product[0].id,
        date,
        reviews_count: 100 + index,
        rating: (4.0 + (index * 0.1)).toString() // Convert to string for numeric column
      })))
      .execute();

    const result = await getReviewHistory(product[0].id);

    expect(result).toHaveLength(4);
    
    // Should be ordered by date descending
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[1].date).toEqual('2024-01-10');
    expect(result[2].date).toEqual('2024-01-05');
    expect(result[3].date).toEqual('2024-01-01');
  });
});
