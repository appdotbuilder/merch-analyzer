
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, productsTable, productKeywordsTable } from '../db/schema';
import { addProductKeyword } from '../handlers/add_product_keyword';
import { eq } from 'drizzle-orm';

describe('addProductKeyword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a keyword to an existing product', async () => {
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        marketplace_id: 1,
        title: 'Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const keyword = 'test keyword';

    const result = await addProductKeyword(productId, keyword);

    // Verify the returned data
    expect(result.id).toBeDefined();
    expect(result.product_id).toEqual(productId);
    expect(result.keyword).toEqual(keyword);
    expect(typeof result.id).toBe('number');
  });

  it('should save keyword to database', async () => {
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        marketplace_id: 1,
        title: 'Another Test Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const keyword = 'another test keyword';

    const result = await addProductKeyword(productId, keyword);

    // Query the database to verify the keyword was saved
    const savedKeywords = await db.select()
      .from(productKeywordsTable)
      .where(eq(productKeywordsTable.id, result.id))
      .execute();

    expect(savedKeywords).toHaveLength(1);
    expect(savedKeywords[0].product_id).toEqual(productId);
    expect(savedKeywords[0].keyword).toEqual(keyword);
  });

  it('should allow multiple keywords for the same product', async () => {
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST789',
        marketplace_id: 1,
        title: 'Multi-keyword Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Add multiple keywords
    const keyword1 = 'first keyword';
    const keyword2 = 'second keyword';

    const result1 = await addProductKeyword(productId, keyword1);
    const result2 = await addProductKeyword(productId, keyword2);

    // Verify both keywords exist
    const allKeywords = await db.select()
      .from(productKeywordsTable)
      .where(eq(productKeywordsTable.product_id, productId))
      .execute();

    expect(allKeywords).toHaveLength(2);
    expect(allKeywords.map(k => k.keyword)).toContain(keyword1);
    expect(allKeywords.map(k => k.keyword)).toContain(keyword2);
    expect(result1.id).not.toEqual(result2.id);
  });

  it('should throw error for non-existent product', async () => {
    const nonExistentProductId = 99999;
    const keyword = 'test keyword';

    await expect(addProductKeyword(nonExistentProductId, keyword))
      .rejects.toThrow(/Product with ID 99999 not found/i);
  });

  it('should handle special characters in keywords', async () => {
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values({
        id: 1,
        code: 'US',
        name: 'United States'
      })
      .execute();

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'SPECIAL123',
        marketplace_id: 1,
        title: 'Special Character Product'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const specialKeyword = 'keyword with "quotes" & symbols!';

    const result = await addProductKeyword(productId, specialKeyword);

    expect(result.keyword).toEqual(specialKeyword);

    // Verify it was saved correctly
    const savedKeyword = await db.select()
      .from(productKeywordsTable)
      .where(eq(productKeywordsTable.id, result.id))
      .execute();

    expect(savedKeyword[0].keyword).toEqual(specialKeyword);
  });
});
