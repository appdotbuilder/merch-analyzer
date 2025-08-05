
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { brandsTable } from '../db/schema';
import { createBrand } from '../handlers/create_brand';
import { eq } from 'drizzle-orm';

describe('createBrand', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a brand', async () => {
    const result = await createBrand('Test Brand');

    expect(result.name).toEqual('Test Brand');
    expect(result.normalized_name).toEqual('test brand');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should save brand to database', async () => {
    const result = await createBrand('Test Brand');

    const brands = await db.select()
      .from(brandsTable)
      .where(eq(brandsTable.id, result.id))
      .execute();

    expect(brands).toHaveLength(1);
    expect(brands[0].name).toEqual('Test Brand');
    expect(brands[0].normalized_name).toEqual('test brand');
  });

  it('should generate normalized name from brand name', async () => {
    const result = await createBrand('  UPPERCASE Brand  ');

    expect(result.name).toEqual('  UPPERCASE Brand  ');
    expect(result.normalized_name).toEqual('uppercase brand');
  });

  it('should handle special characters in brand name', async () => {
    const result = await createBrand('Brand & Co.');

    expect(result.name).toEqual('Brand & Co.');
    expect(result.normalized_name).toEqual('brand & co.');
  });

  it('should throw error for duplicate brand name', async () => {
    await createBrand('Duplicate Brand');

    expect(createBrand('Duplicate Brand')).rejects.toThrow(/duplicate key value/i);
  });

  it('should create multiple brands with different names', async () => {
    const brand1 = await createBrand('Brand One');
    const brand2 = await createBrand('Brand Two');

    expect(brand1.name).toEqual('Brand One');
    expect(brand2.name).toEqual('Brand Two');
    expect(brand1.id).not.toEqual(brand2.id);
  });
});
