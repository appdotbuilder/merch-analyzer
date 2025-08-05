
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable, excludedBrandsTable, excludedKeywordsTable, favoriteGroupsTable, brandsTable } from '../db/schema';
import { getUserPreference } from '../handlers/get_user_preference';

const testUserId = '550e8400-e29b-41d4-a716-446655440000';
const testUserId2 = '550e8400-e29b-41d4-a716-446655440001';

describe('getUserPreference', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when user has no preferences', async () => {
    // Create a user profile but no preferences
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getUserPreference(testUserId);
    expect(result).toBeNull();
  });

  it('should return user preferences with excluded brands', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create brands
    const brandsResult = await db.insert(brandsTable).values([
      { name: 'Nike', normalized_name: 'nike' },
      { name: 'Adidas', normalized_name: 'adidas' }
    ]).returning().execute();

    // Create excluded brands
    await db.insert(excludedBrandsTable).values([
      { user_id: testUserId, brand_id: brandsResult[0].id },
      { user_id: testUserId, brand_id: brandsResult[1].id }
    ]).execute();

    const result = await getUserPreference(testUserId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.excluded_brands).toHaveLength(2);
    expect(result!.excluded_brands[0].brand_name).toEqual('Nike');
    expect(result!.excluded_brands[1].brand_name).toEqual('Adidas');
    expect(result!.excluded_brands[0].brand_id).toEqual(brandsResult[0].id);
    expect(result!.excluded_brands[0].created_at).toBeInstanceOf(Date);
    expect(result!.excluded_keywords).toHaveLength(0);
    expect(result!.favorite_groups).toHaveLength(0);
  });

  it('should return user preferences with excluded keywords', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create excluded keywords
    await db.insert(excludedKeywordsTable).values([
      { user_id: testUserId, keyword: 'offensive' },
      { user_id: testUserId, keyword: 'inappropriate' }
    ]).execute();

    const result = await getUserPreference(testUserId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.excluded_keywords).toHaveLength(2);
    expect(result!.excluded_keywords[0].keyword).toEqual('offensive');
    expect(result!.excluded_keywords[1].keyword).toEqual('inappropriate');
    expect(result!.excluded_keywords[0].created_at).toBeInstanceOf(Date);
    expect(result!.excluded_brands).toHaveLength(0);
    expect(result!.favorite_groups).toHaveLength(0);
  });

  it('should return user preferences with favorite groups', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create favorite groups
    await db.insert(favoriteGroupsTable).values([
      { user_id: testUserId, name: 'Sports Products' },
      { user_id: testUserId, name: 'Tech Gadgets' }
    ]).execute();

    const result = await getUserPreference(testUserId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.favorite_groups).toHaveLength(2);
    expect(result!.favorite_groups[0].name).toEqual('Sports Products');
    expect(result!.favorite_groups[1].name).toEqual('Tech Gadgets');
    expect(result!.favorite_groups[0].created_at).toBeInstanceOf(Date);
    expect(result!.favorite_groups[0].updated_at).toBeInstanceOf(Date);
    expect(result!.excluded_brands).toHaveLength(0);
    expect(result!.excluded_keywords).toHaveLength(0);
  });

  it('should return complete user preferences with all preference types', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create brands
    const brandsResult = await db.insert(brandsTable).values([
      { name: 'Nike', normalized_name: 'nike' }
    ]).returning().execute();

    // Create all types of preferences
    await db.insert(excludedBrandsTable).values([
      { user_id: testUserId, brand_id: brandsResult[0].id }
    ]).execute();

    await db.insert(excludedKeywordsTable).values([
      { user_id: testUserId, keyword: 'spam' }
    ]).execute();

    await db.insert(favoriteGroupsTable).values([
      { user_id: testUserId, name: 'My Favorites' }
    ]).execute();

    const result = await getUserPreference(testUserId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.excluded_brands).toHaveLength(1);
    expect(result!.excluded_keywords).toHaveLength(1);
    expect(result!.favorite_groups).toHaveLength(1);
    expect(result!.excluded_brands[0].brand_name).toEqual('Nike');
    expect(result!.excluded_keywords[0].keyword).toEqual('spam');
    expect(result!.favorite_groups[0].name).toEqual('My Favorites');
  });

  it('should only return preferences for the specified user', async () => {
    // Create two user profiles
    await db.insert(profilesTable).values([
      { user_id: testUserId, email: 'user1@example.com', full_name: 'User 1' },
      { user_id: testUserId2, email: 'user2@example.com', full_name: 'User 2' }
    ]).execute();

    // Create brands
    const brandsResult = await db.insert(brandsTable).values([
      { name: 'Nike', normalized_name: 'nike' },
      { name: 'Adidas', normalized_name: 'adidas' }
    ]).returning().execute();

    // Create preferences for both users
    await db.insert(excludedBrandsTable).values([
      { user_id: testUserId, brand_id: brandsResult[0].id },
      { user_id: testUserId2, brand_id: brandsResult[1].id }
    ]).execute();

    await db.insert(excludedKeywordsTable).values([
      { user_id: testUserId, keyword: 'user1-keyword' },
      { user_id: testUserId2, keyword: 'user2-keyword' }
    ]).execute();

    // Get preferences for first user
    const result = await getUserPreference(testUserId);

    expect(result).not.toBeNull();
    expect(result!.user_id).toEqual(testUserId);
    expect(result!.excluded_brands).toHaveLength(1);
    expect(result!.excluded_brands[0].brand_name).toEqual('Nike');
    expect(result!.excluded_keywords).toHaveLength(1);
    expect(result!.excluded_keywords[0].keyword).toEqual('user1-keyword');
  });
});
