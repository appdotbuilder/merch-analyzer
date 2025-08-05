
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { favoriteGroupsTable, profilesTable } from '../db/schema';
import { createFavoriteGroup, type CreateFavoriteGroupInput } from '../handlers/create_favorite_group';
import { eq } from 'drizzle-orm';

// Test user ID
const testUserId = '123e4567-e89b-12d3-a456-426614174000';

// Simple test input
const testInput: CreateFavoriteGroupInput = {
  user_id: testUserId,
  name: 'My Favorite Products'
};

describe('createFavoriteGroup', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a favorite group', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createFavoriteGroup(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('My Favorite Products');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save favorite group to database', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createFavoriteGroup(testInput);

    // Query using proper drizzle syntax
    const favoriteGroups = await db.select()
      .from(favoriteGroupsTable)
      .where(eq(favoriteGroupsTable.id, result.id))
      .execute();

    expect(favoriteGroups).toHaveLength(1);
    expect(favoriteGroups[0].user_id).toEqual(testUserId);
    expect(favoriteGroups[0].name).toEqual('My Favorite Products');
    expect(favoriteGroups[0].created_at).toBeInstanceOf(Date);
    expect(favoriteGroups[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create multiple favorite groups for same user', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    // Create first favorite group
    const firstGroup = await createFavoriteGroup({
      user_id: testUserId,
      name: 'Work Products'
    });

    // Create second favorite group
    const secondGroup = await createFavoriteGroup({
      user_id: testUserId,
      name: 'Personal Products'
    });

    expect(firstGroup.id).not.toEqual(secondGroup.id);
    expect(firstGroup.name).toEqual('Work Products');
    expect(secondGroup.name).toEqual('Personal Products');
    expect(firstGroup.user_id).toEqual(testUserId);
    expect(secondGroup.user_id).toEqual(testUserId);

    // Verify both groups exist in database
    const favoriteGroups = await db.select()
      .from(favoriteGroupsTable)
      .where(eq(favoriteGroupsTable.user_id, testUserId))
      .execute();

    expect(favoriteGroups).toHaveLength(2);
  });

  it('should handle foreign key constraint violation', async () => {
    // Try to create favorite group without prerequisite profile
    const invalidInput: CreateFavoriteGroupInput = {
      user_id: '999e4567-e89b-12d3-a456-426614174999', // Non-existent user
      name: 'Test Group'
    };

    await expect(createFavoriteGroup(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
