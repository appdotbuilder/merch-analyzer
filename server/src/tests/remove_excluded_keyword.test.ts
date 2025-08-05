
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable, excludedKeywordsTable } from '../db/schema';
import { type RemoveExcludedKeywordInput, removeExcludedKeyword } from '../handlers/remove_excluded_keyword';
import { eq, and } from 'drizzle-orm';

const testUserId = '123e4567-e89b-12d3-a456-426614174000';

const testInput: RemoveExcludedKeywordInput = {
  user_id: testUserId,
  keyword: 'spam keyword'
};

describe('removeExcludedKeyword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove an excluded keyword', async () => {
    // Create test user profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create excluded keyword to remove
    await db.insert(excludedKeywordsTable)
      .values({
        user_id: testUserId,
        keyword: 'spam keyword'
      })
      .execute();

    // Verify keyword exists before removal
    const beforeRemoval = await db.select()
      .from(excludedKeywordsTable)
      .where(
        and(
          eq(excludedKeywordsTable.user_id, testUserId),
          eq(excludedKeywordsTable.keyword, 'spam keyword')
        )
      )
      .execute();

    expect(beforeRemoval).toHaveLength(1);

    // Remove the keyword
    await removeExcludedKeyword(testInput);

    // Verify keyword was removed
    const afterRemoval = await db.select()
      .from(excludedKeywordsTable)
      .where(
        and(
          eq(excludedKeywordsTable.user_id, testUserId),
          eq(excludedKeywordsTable.keyword, 'spam keyword')
        )
      )
      .execute();

    expect(afterRemoval).toHaveLength(0);
  });

  it('should handle removing non-existent keyword gracefully', async () => {
    // Create test user profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Try to remove keyword that doesn't exist
    await expect(removeExcludedKeyword({
      user_id: testUserId,
      keyword: 'non-existent keyword'
    })).resolves.toBeUndefined();

    // Verify no keywords exist for this user
    const keywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(keywords).toHaveLength(0);
  });

  it('should only remove keyword for specific user', async () => {
    const otherUserId = '987fcdeb-51a2-43d1-b234-123456789abc';

    // Create test user profiles
    await db.insert(profilesTable)
      .values([
        {
          user_id: testUserId,
          email: 'test@example.com',
          full_name: 'Test User'
        },
        {
          user_id: otherUserId,
          email: 'other@example.com',
          full_name: 'Other User'
        }
      ])
      .execute();

    // Create same keyword for both users
    await db.insert(excludedKeywordsTable)
      .values([
        {
          user_id: testUserId,
          keyword: 'shared keyword'
        },
        {
          user_id: otherUserId,
          keyword: 'shared keyword'
        }
      ])
      .execute();

    // Remove keyword for first user only
    await removeExcludedKeyword({
      user_id: testUserId,
      keyword: 'shared keyword'
    });

    // Verify keyword removed for first user
    const firstUserKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(firstUserKeywords).toHaveLength(0);

    // Verify keyword still exists for second user
    const secondUserKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, otherUserId))
      .execute();

    expect(secondUserKeywords).toHaveLength(1);
    expect(secondUserKeywords[0].keyword).toEqual('shared keyword');
  });

  it('should handle multiple keywords for same user correctly', async () => {
    // Create test user profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create multiple excluded keywords
    await db.insert(excludedKeywordsTable)
      .values([
        {
          user_id: testUserId,
          keyword: 'keyword1'
        },
        {
          user_id: testUserId,
          keyword: 'keyword2'
        },
        {
          user_id: testUserId,
          keyword: 'keyword3'
        }
      ])
      .execute();

    // Remove one specific keyword
    await removeExcludedKeyword({
      user_id: testUserId,
      keyword: 'keyword2'
    });

    // Verify only the targeted keyword was removed
    const remainingKeywords = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, testUserId))
      .execute();

    expect(remainingKeywords).toHaveLength(2);
    
    const keywordTexts = remainingKeywords.map(k => k.keyword).sort();
    expect(keywordTexts).toEqual(['keyword1', 'keyword3']);
  });
});
