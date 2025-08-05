
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { profilesTable } from '../db/schema';
import { createProfile } from '../handlers/create_profile';
import { eq } from 'drizzle-orm';

// Define input type locally since it's not in schema.ts yet
type CreateProfileInput = {
  user_id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

const testInput: CreateProfileInput = {
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg'
};

describe('createProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a profile with all fields', async () => {
    const result = await createProfile(testInput);

    expect(result.user_id).toEqual('550e8400-e29b-41d4-a716-446655440000');
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a profile with minimal fields', async () => {
    const minimalInput: CreateProfileInput = {
      user_id: '550e8400-e29b-41d4-a716-446655440001'
    };

    const result = await createProfile(minimalInput);

    expect(result.user_id).toEqual('550e8400-e29b-41d4-a716-446655440001');
    expect(result.email).toBeNull();
    expect(result.full_name).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save profile to database', async () => {
    const result = await createProfile(testInput);

    const profiles = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, result.user_id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].user_id).toEqual('550e8400-e29b-41d4-a716-446655440000');
    expect(profiles[0].email).toEqual('test@example.com');
    expect(profiles[0].full_name).toEqual('Test User');
    expect(profiles[0].avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
    expect(profiles[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate user_id appropriately', async () => {
    // Create first profile
    await createProfile(testInput);

    // Attempt to create duplicate should throw error
    await expect(createProfile(testInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should validate UUID format', async () => {
    const invalidInput: CreateProfileInput = {
      user_id: 'invalid-uuid-format'
    };

    await expect(createProfile(invalidInput)).rejects.toThrow();
  });
});
