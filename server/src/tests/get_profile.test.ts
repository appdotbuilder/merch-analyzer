
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable } from '../db/schema';
import { getProfile } from '../handlers/get_profile';
import { eq } from 'drizzle-orm';

const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

const testProfile = {
  user_id: testUserId,
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg'
};

describe('getProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return profile when user exists', async () => {
    // Create test profile
    await db.insert(profilesTable)
      .values(testProfile)
      .execute();

    const result = await getProfile(testUserId);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(testUserId);
    expect(result?.email).toEqual('test@example.com');
    expect(result?.full_name).toEqual('Test User');
    expect(result?.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const nonExistentUserId = 'b47ac10b-58cc-4372-a567-0e02b2c3d478';
    
    const result = await getProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should handle profile with minimal data', async () => {
    const minimalProfile = {
      user_id: testUserId,
      email: null,
      full_name: null,
      avatar_url: null
    };

    await db.insert(profilesTable)
      .values(minimalProfile)
      .execute();

    const result = await getProfile(testUserId);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(testUserId);
    expect(result?.email).toBeNull();
    expect(result?.full_name).toBeNull();
    expect(result?.avatar_url).toBeNull();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should verify profile is stored correctly in database', async () => {
    await db.insert(profilesTable)
      .values(testProfile)
      .execute();

    // Verify via direct database query
    const profiles = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, testUserId))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].user_id).toEqual(testUserId);
    expect(profiles[0].email).toEqual('test@example.com');
    expect(profiles[0].full_name).toEqual('Test User');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
  });
});
