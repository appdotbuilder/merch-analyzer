
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, marketplacesTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should soft delete an existing product', async () => {
    // Create marketplace first
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
        asin: 'TEST123',
        marketplace_id: 1,
        title: 'Test Product',
        deleted: false
      })
      .returning({ id: productsTable.id })
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is soft deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].deleted).toBe(true);
    expect(products[0].updated_at).toBeDefined();
  });

  it('should return false for non-existent product', async () => {
    const nonExistentId = 99999;

    const result = await deleteProduct(nonExistentId);

    expect(result).toBe(false);
  });

  it('should return true when deleting already deleted product', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product that's already deleted
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Already Deleted Product',
        deleted: true
      })
      .returning({ id: productsTable.id })
      .execute();

    const productId = productResult[0].id;

    // Try to delete already deleted product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product remains deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].deleted).toBe(true);
  });

  it('should update the updated_at timestamp', async () => {
    // Create marketplace first
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create test product
    const originalTime = new Date('2023-01-01');
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: 1,
        title: 'Time Test Product',
        deleted: false,
        updated_at: originalTime
      })
      .returning({ id: productsTable.id })
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    await deleteProduct(productId);

    // Verify updated_at was changed
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
    const product = products[0];
    expect(product.updated_at).toBeDefined();
    expect(product.updated_at!.getTime()).toBeGreaterThan(originalTime.getTime());
  });
});
