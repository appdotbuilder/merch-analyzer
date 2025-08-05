
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { excludedBrandsTable, excludedKeywordsTable, profilesTable, brandsTable } from '../db/schema';
import { createUserPreference, type CreateUserPreferenceInput } from '../handlers/create_user_preference';
import { eq } from 'drizzle-orm';

const testUserId = '550e8400-e29b-41d4-a716-446655440000';

const testInput: CreateUserPreferenceInput = {
  user_id: testUserId,
  excluded_brands: [1, 2],
  excluded_keywords: ['cheap', 'knockoff'],
  preferred_marketplaces: [1, 2],
  preferred_product_types: [1, 3]
};

describe('createUserPreference', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test brands with proper normalized_name
    await db.insert(brandsTable)
      .values([
        { name: 'Brand One', normalized_name: 'brand one' },
        { name: 'Brand Two', normalized_name: 'brand two' },
        { name: 'Brand Three', normalized_name: 'brand three' }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should create user preferences for new user', async () => {
    const result = await createUserPreference(testInput);

    // Verify the returned object structure
    expect(result.user_id).toEqual(testUserId);
    expect(result.excluded_brands).toEqual([1, 2]);
    expect(result.excluded_keywords).toEqual(['cheap', 'knockoff']);
    expect(result.preferred_marketplaces).toEqual([1, 2]);
    expect(result.preferred_product_types).toEqual([1, 3]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create profile if it does not exist', async () => {
    await createUserPreference(testInput);

    const profiles = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, testUserId))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].user_id).toEqual(testUserId);
    expect(profiles[0].created_at).toBeInstanceOf(Date);
  });

  it('should save excluded brands to database', async () => {
    await createUserPreference(testInput);

    const excludedBrands = await db.select()
      .from(excludedBrandsTable)
      .where(eq(excludedBrandsTable.user_id, testUserId))
      .execute();

    expect(excludedBrands).toHaveLength(2);
    expect(excludedBrands.map(eb => eb.brand_id).sort()).toEqual([1, 2]);
    excludedBrands.forEach(eb => {
      expect(eb.user_id).toEqual(testUserId);
      expect(eb.created_at).toBeInstanceOf(Date);
    });
  });

  it('should save excluded keywords to database', async () => {
    await createUserPreference(testInput);

    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(excludedKeywords).toHaveLength(2);
    expect(excludedKeywords.map(ek => ek.keyword).sort()).toEqual(['cheap', 'knockoff']);
    excludedKeywords.forEach(ek => {
      expect(ek.user_id).toEqual(testUserId);
      expect(ek.created_at).toBeInstanceOf(Date);
    });
  });

  it('should update existing preferences', async () => {
    // Create initial preferences
    await createUserPreference(testInput);

    // Update with new preferences
    const updatedInput: CreateUserPreferenceInput = {
      user_id: testUserId,
      excluded_brands: [2, 3], // Changed brands
      excluded_keywords: ['spam'], // Changed keywords
      preferred_marketplaces: [1],
      preferred_product_types: [2]
    };

    const result = await createUserPreference(updatedInput);

    // Verify updated preferences are returned
    expect(result.excluded_brands.sort()).toEqual([2, 3]);
    expect(result.excluded_keywords).toEqual(['spam']);

    // Verify database reflects the updates
    const excludedBrands = await db.select()
      .from(excludedBrandsTable)
      .where(eq(excludedBrandsTable.user_id, testUserId))
      .execute();

    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(excludedBrands).toHaveLength(2);
    expect(excludedBrands.map(eb => eb.brand_id).sort()).toEqual([2, 3]);
    expect(excludedKeywords).toHaveLength(1);
    expect(excludedKeywords[0].keyword).toEqual('spam');
  });

  it('should handle empty excluded arrays', async () => {
    const emptyInput: CreateUserPreferenceInput = {
      user_id: testUserId,
      excluded_brands: [],
      excluded_keywords: [],
      preferred_marketplaces: [1],
      preferred_product_types: [1]
    };

    const result = await createUserPreference(emptyInput);

    expect(result.excluded_brands).toEqual([]);
    expect(result.excluded_keywords).toEqual([]);

    // Verify no excluded items in database
    const excludedBrands = await db.select()
      .from(excludedBrandsTable)
      .where(eq(excludedBrandsTable.user_id, testUserId))
      .execute();

    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(excludedBrands).toHaveLength(0);
    expect(excludedKeywords).toHaveLength(0);
  });

  it('should handle foreign key constraint violations', async () => {
    const invalidInput: CreateUserPreferenceInput = {
      user_id: testUserId,
      excluded_brands: [999], // Non-existent brand ID
      excluded_keywords: ['test'],
      preferred_marketplaces: [1],
      preferred_product_types: [1]
    };

    await expect(createUserPreference(invalidInput)).rejects.toThrow(/violates foreign key constraint|FOREIGN KEY constraint failed/i);
  });
});
