
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { favoriteGroupsTable, profilesTable } from '../db/schema';
import { getFavoriteGroups } from '../handlers/get_favorite_groups';

const testUserId = '123e4567-e89b-12d3-a456-426614174000';
const testUserId2 = '123e4567-e89b-12d3-a456-426614174001';

describe('getFavoriteGroups', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no favorite groups', async () => {
    // Create profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const result = await getFavoriteGroups(testUserId);

    expect(result).toEqual([]);
  });

  it('should return user favorite groups ordered by created_at descending', async () => {
    // Create profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    // Create favorite groups with different timestamps
    const group1 = await db.insert(favoriteGroupsTable).values({
      user_id: testUserId,
      name: 'First Group',
      created_at: new Date('2023-01-01T10:00:00Z'),
      updated_at: new Date('2023-01-01T10:00:00Z')
    }).returning().execute();

    const group2 = await db.insert(favoriteGroupsTable).values({
      user_id: testUserId,
      name: 'Second Group',
      created_at: new Date('2023-01-02T10:00:00Z'),
      updated_at: new Date('2023-01-02T10:00:00Z')
    }).returning().execute();

    const group3 = await db.insert(favoriteGroupsTable).values({
      user_id: testUserId,
      name: 'Third Group',
      created_at: new Date('2023-01-03T10:00:00Z'),
      updated_at: new Date('2023-01-03T10:00:00Z')
    }).returning().execute();

    const result = await getFavoriteGroups(testUserId);

    expect(result).toHaveLength(3);
    // Should be ordered by created_at descending (most recent first)
    expect(result[0].name).toEqual('Third Group');
    expect(result[1].name).toEqual('Second Group');
    expect(result[2].name).toEqual('First Group');

    // Verify all fields are present
    expect(result[0].id).toEqual(group3[0].id);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should only return favorite groups for the specified user', async () => {
    // Create profiles for both users
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

    // Create groups for both users
    await db.insert(favoriteGroupsTable).values([
      {
        user_id: testUserId,
        name: 'User 1 Group'
      },
      {
        user_id: testUserId2,
        name: 'User 2 Group'
      }
    ]).execute();

    const result = await getFavoriteGroups(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('User 1 Group');
    expect(result[0].user_id).toEqual(testUserId);
  });

  it('should handle multiple groups with same created_at timestamp', async () => {
    // Create profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    const sameTimestamp = new Date('2023-01-01T10:00:00Z');

    // Create multiple groups with same timestamp
    await db.insert(favoriteGroupsTable).values([
      {
        user_id: testUserId,
        name: 'Group A',
        created_at: sameTimestamp,
        updated_at: sameTimestamp
      },
      {
        user_id: testUserId,
        name: 'Group B',
        created_at: sameTimestamp,
        updated_at: sameTimestamp
      }
    ]).execute();

    const result = await getFavoriteGroups(testUserId);

    expect(result).toHaveLength(2);
    // Both groups should be returned
    const groupNames = result.map(g => g.name).sort();
    expect(groupNames).toEqual(['Group A', 'Group B']);
  });
});
