
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productsTable, bsrHistoryTable } from '../db/schema';
import { getBsrHistory } from '../handlers/get_bsr_history';

describe('getBsrHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return BSR history for a product', async () => {
    // Create marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: marketplace[0].id,
        title: 'Test Product',
        first_seen_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    // Create BSR history entries
    await db.insert(bsrHistoryTable)
      .values([
        {
          product_id: product[0].id,
          date: '2024-01-15',
          bsr: 1000
        },
        {
          product_id: product[0].id,
          date: '2024-01-14',
          bsr: 1200
        },
        {
          product_id: product[0].id,
          date: '2024-01-13',
          bsr: 800
        }
      ])
      .execute();

    const result = await getBsrHistory(Number(product[0].id));

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual('2024-01-15'); // Most recent first
    expect(result[0].bsr).toEqual(1000);
    expect(result[1].date).toEqual('2024-01-14');
    expect(result[1].bsr).toEqual(1200);
    expect(result[2].date).toEqual('2024-01-13');
    expect(result[2].bsr).toEqual(800);
    
    // Verify all entries have correct product_id
    result.forEach(entry => {
      expect(entry.product_id).toEqual(Number(product[0].id));
      expect(typeof entry.product_id).toBe('number');
    });
  });

  it('should return empty array for product with no BSR history', async () => {
    // Create marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: marketplace[0].id,
        title: 'Test Product',
        first_seen_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    const result = await getBsrHistory(Number(product[0].id));

    expect(result).toHaveLength(0);
  });

  it('should handle BSR history with null values', async () => {
    // Create marketplace
    const marketplace = await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .returning()
      .execute();

    // Create product
    const product = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: marketplace[0].id,
        title: 'Test Product',
        first_seen_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    // Create BSR history with null BSR value
    await db.insert(bsrHistoryTable)
      .values([
        {
          product_id: product[0].id,
          date: '2024-01-15',
          bsr: null
        },
        {
          product_id: product[0].id,
          date: '2024-01-14',
          bsr: 1500
        }
      ])
      .execute();

    const result = await getBsrHistory(Number(product[0].id));

    expect(result).toHaveLength(2);
    expect(result[0].date).toEqual('2024-01-15');
    expect(result[0].bsr).toBeNull();
    expect(result[1].date).toEqual('2024-01-14');
    expect(result[1].bsr).toEqual(1500);
  });
});
