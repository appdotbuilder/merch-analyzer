
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { excludedKeywordsTable, profilesTable } from '../db/schema';
import { addExcludedKeyword, type AddExcludedKeywordInput } from '../handlers/add_excluded_keyword';
import { eq } from 'drizzle-orm';

const testUserId = '123e4567-e89b-12d3-a456-426614174000';

const testInput: AddExcludedKeywordInput = {
  user_id: testUserId,
  keyword: 'nike'
};

describe('addExcludedKeyword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test user profile first
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();
  });

  it('should add an excluded keyword', async () => {
    const result = await addExcludedKeyword(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.keyword).toEqual('nike');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save excluded keyword to database', async () => {
    const result = await addExcludedKeyword(testInput);

    // Query database to verify
    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.id, result.id))
      .execute();

    expect(excludedKeywords).toHaveLength(1);
    expect(excludedKeywords[0].user_id).toEqual(testUserId);
    expect(excludedKeywords[0].keyword).toEqual('nike');
    expect(excludedKeywords[0].created_at).toBeInstanceOf(Date);
  });

  it('should allow multiple excluded keywords for same user', async () => {
    // Add first keyword
    await addExcludedKeyword(testInput);

    // Add second keyword
    const secondInput: AddExcludedKeywordInput = {
      user_id: testUserId,
      keyword: 'adidas'
    };
    const result2 = await addExcludedKeyword(secondInput);

    // Verify both exist
    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(excludedKeywords).toHaveLength(2);
    const keywords = excludedKeywords.map(ek => ek.keyword).sort();
    expect(keywords).toEqual(['adidas', 'nike']);
  });

  it('should allow same keyword for different users', async () => {
    const secondUserId = '123e4567-e89b-12d3-a456-426614174001';
    
    // Create second user profile
    await db.insert(profilesTable)
      .values({
        user_id: secondUserId,
        email: 'test2@example.com',
        full_name: 'Test User 2'
      })
      .execute();

    // Add same keyword for both users
    await addExcludedKeyword(testInput);
    
    const secondInput: AddExcludedKeywordInput = {
      user_id: secondUserId,
      keyword: 'nike'
    };
    await addExcludedKeyword(secondInput);

    // Verify both exist
    const excludedKeywords = await db.select()
      .from(excludedKeywordsTable)
      .execute();

    expect(excludedKeywords).toHaveLength(2);
    expect(excludedKeywords.every(ek => ek.keyword === 'nike')).toBe(true);
    
    const userIds = excludedKeywords.map(ek => ek.user_id).sort();
    expect(userIds).toEqual([testUserId, secondUserId].sort());
  });
});
