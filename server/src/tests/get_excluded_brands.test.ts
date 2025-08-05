
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable, brandsTable, excludedBrandsTable } from '../db/schema';
import { getExcludedBrands } from '../handlers/get_excluded_brands';

const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const anotherUserId = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';

describe('getExcludedBrands', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return excluded brands for a user', async () => {
    // Create test profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create test brands with normalized_name
    const brandResults = await db.insert(brandsTable).values([
      { name: 'Nike', normalized_name: 'nike' },
      { name: 'Adidas', normalized_name: 'adidas' }
    ]).returning().execute();

    const nikeBrand = brandResults[0];
    const adidasBrand = brandResults[1];

    // Create excluded brands for user
    await db.insert(excludedBrandsTable).values([
      {
        user_id: testUserId,
        brand_id: nikeBrand.id
      },
      {
        user_id: testUserId,
        brand_id: adidasBrand.id
      }
    ]).execute();

    const result = await getExcludedBrands(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].brand_id).toEqual(nikeBrand.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].user_id).toEqual(testUserId);
    expect(result[1].brand_id).toEqual(adidasBrand.id);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should return empty array when user has no excluded brands', async () => {
    // Create test profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getExcludedBrands(testUserId);

    expect(result).toHaveLength(0);
  });

  it('should only return excluded brands for the specified user', async () => {
    // Create test profiles
    await db.insert(profilesTable).values([
      {
        user_id: testUserId,
        email: 'test1@example.com',
        full_name: 'Test User 1'
      },
      {
        user_id: anotherUserId,
        email: 'test2@example.com',
        full_name: 'Test User 2'
      }
    ]).execute();

    // Create test brands with normalized_name
    const brandResults = await db.insert(brandsTable).values([
      { name: 'Nike', normalized_name: 'nike' },
      { name: 'Adidas', normalized_name: 'adidas' }
    ]).returning().execute();

    const nikeBrand = brandResults[0];
    const adidasBrand = brandResults[1];

    // Create excluded brands for both users
    await db.insert(excludedBrandsTable).values([
      {
        user_id: testUserId,
        brand_id: nikeBrand.id
      },
      {
        user_id: anotherUserId,
        brand_id: adidasBrand.id
      }
    ]).execute();

    const result = await getExcludedBrands(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].brand_id).toEqual(nikeBrand.id);
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';

    const result = await getExcludedBrands(nonExistentUserId);

    expect(result).toHaveLength(0);
  });
});
