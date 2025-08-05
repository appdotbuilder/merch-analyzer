
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable, excludedKeywordsTable } from '../db/schema';
import { getExcludedKeywords } from '../handlers/get_excluded_keywords';

const testUserId = '123e4567-e89b-12d3-a456-426614174000';
const testUserId2 = '123e4567-e89b-12d3-a456-426614174001';

describe('getExcludedKeywords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no excluded keywords', async () => {
    // Create user profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getExcludedKeywords(testUserId);

    expect(result).toEqual([]);
  });

  it('should return all excluded keywords for a user', async () => {
    // Create user profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create excluded keywords
    await db.insert(excludedKeywordsTable).values([
      {
        user_id: testUserId,
        keyword: 'offensive term'
      },
      {
        user_id: testUserId,
        keyword: 'inappropriate content'
      },
      {
        user_id: testUserId,
        keyword: 'spam keyword'
      }
    ]).execute();

    const result = await getExcludedKeywords(testUserId);

    expect(result).toHaveLength(3);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].keyword).toEqual('offensive term');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check all keywords are present
    const keywords = result.map(item => item.keyword).sort();
    expect(keywords).toEqual(['inappropriate content', 'offensive term', 'spam keyword']);
  });

  it('should only return keywords for the specified user', async () => {
    // Create two user profiles
    await db.insert(profilesTable).values([
      {
        user_id: testUserId,
        email: 'test1@example.com',
        full_name: 'Test User 1'
      },
      {
        user_id: testUserId2,
        email: 'test2@example.com',
        full_name: 'Test User 2'
      }
    ]).execute();

    // Create excluded keywords for both users
    await db.insert(excludedKeywordsTable).values([
      {
        user_id: testUserId,
        keyword: 'user1 keyword'
      },
      {
        user_id: testUserId2,
        keyword: 'user2 keyword'
      },
      {
        user_id: testUserId,
        keyword: 'another user1 keyword'
      }
    ]).execute();

    const result = await getExcludedKeywords(testUserId);

    expect(result).toHaveLength(2);
    expect(result.every(item => item.user_id === testUserId)).toBe(true);
    
    const keywords = result.map(item => item.keyword).sort();
    expect(keywords).toEqual(['another user1 keyword', 'user1 keyword']);
  });

  it('should return keywords ordered by creation date', async () => {
    // Create user profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create excluded keywords with slight delays to ensure different timestamps
    await db.insert(excludedKeywordsTable).values({
      user_id: testUserId,
      keyword: 'first keyword'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(excludedKeywordsTable).values({
      user_id: testUserId,
      keyword: 'second keyword'
    }).execute();

    const result = await getExcludedKeywords(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle user with UUID format correctly', async () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: validUuid,
      email: 'uuid-test@example.com',
      full_name: 'UUID Test User'
    }).execute();

    // Create excluded keyword
    await db.insert(excludedKeywordsTable).values({
      user_id: validUuid,
      keyword: 'test keyword'
    }).execute();

    const result = await getExcludedKeywords(validUuid);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(validUuid);
    expect(result[0].keyword).toEqual('test keyword');
  });
});
