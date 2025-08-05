
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, priceHistoryTable, marketplacesTable, brandsTable } from '../db/schema';
import { getPriceHistory } from '../handlers/get_price_history';

describe('getPriceHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no price history exists', async () => {
    const result = await getPriceHistory(999);
    expect(result).toEqual([]);
  });

  it('should return price history for a product', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    await db.insert(brandsTable).values({
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).execute();

    const [brand] = await db.select().from(brandsTable).execute();

    const [product] = await db.insert(productsTable).values({
      asin: 'TEST123',
      marketplace_id: 1,
      brand_id: brand.id,
      title: 'Test Product',
      price: '29.99',
      currency_code: 'USD'
    }).returning().execute();

    // Insert price history records
    await db.insert(priceHistoryTable).values([
      {
        product_id: product.id,
        date: '2024-01-01',
        price: '29.99',
        currency_code: 'USD'
      },
      {
        product_id: product.id,
        date: '2024-01-02',
        price: '24.99',
        currency_code: 'USD'
      },
      {
        product_id: product.id,
        date: '2024-01-03',
        price: '34.99',
        currency_code: 'USD'
      }
    ]).execute();

    const result = await getPriceHistory(product.id);

    expect(result).toHaveLength(3);
    
    // Should be ordered by date descending (most recent first)
    expect(result[0].date).toEqual('2024-01-03');
    expect(result[1].date).toEqual('2024-01-02');
    expect(result[2].date).toEqual('2024-01-01');

    // Verify price conversion from string to number
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(34.99);
    expect(result[1].price).toEqual(24.99);
    expect(result[2].price).toEqual(29.99);

    // Verify other fields
    expect(result[0].product_id).toEqual(product.id);
    expect(result[0].currency_code).toEqual('USD');
    expect(result[0].id).toBeDefined();
  });

  it('should handle null prices correctly', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const [product] = await db.insert(productsTable).values({
      asin: 'TEST456',
      marketplace_id: 1,
      title: 'Test Product with Null Price'
    }).returning().execute();

    // Insert price history with null price
    await db.insert(priceHistoryTable).values({
      product_id: product.id,
      date: '2024-01-01',
      price: null,
      currency_code: 'USD'
    }).execute();

    const result = await getPriceHistory(product.id);

    expect(result).toHaveLength(1);
    expect(result[0].price).toBeNull();
    expect(result[0].currency_code).toEqual('USD');
  });

  it('should only return history for specified product', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const [product1] = await db.insert(productsTable).values({
      asin: 'PROD1',
      marketplace_id: 1,
      title: 'Product 1'
    }).returning().execute();

    const [product2] = await db.insert(productsTable).values({
      asin: 'PROD2',
      marketplace_id: 1,
      title: 'Product 2'
    }).returning().execute();

    // Insert price history for both products
    await db.insert(priceHistoryTable).values([
      {
        product_id: product1.id,
        date: '2024-01-01',
        price: '19.99',
        currency_code: 'USD'
      },
      {
        product_id: product2.id,
        date: '2024-01-01',
        price: '39.99',
        currency_code: 'USD'
      }
    ]).execute();

    const result = await getPriceHistory(product1.id);

    expect(result).toHaveLength(1);
    expect(result[0].product_id).toEqual(product1.id);
    expect(result[0].price).toEqual(19.99);
  });

  it('should handle multiple currency codes', async () => {
    // Create prerequisite data
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const [product] = await db.insert(productsTable).values({
      asin: 'MULTI789',
      marketplace_id: 1,
      title: 'Multi-currency Product'
    }).returning().execute();

    // Insert price history with different currencies
    await db.insert(priceHistoryTable).values([
      {
        product_id: product.id,
        date: '2024-01-01',
        price: '29.99',
        currency_code: 'USD'
      },
      {
        product_id: product.id,
        date: '2024-01-02',
        price: '24.99',
        currency_code: 'GBP'
      }
    ]).execute();

    const result = await getPriceHistory(product.id);

    expect(result).toHaveLength(2);
    expect(result[0].currency_code).toEqual('GBP');
    expect(result[1].currency_code).toEqual('USD');
  });
});
