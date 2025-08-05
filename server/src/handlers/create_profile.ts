
import { db } from '../db';
import { profilesTable } from '../db/schema';
import { type Profile } from '../schema';

// Define input type locally since it's not in schema.ts yet
type CreateProfileInput = {
  user_id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

export const createProfile = async (input: CreateProfileInput): Promise<Profile> => {
  try {
    // Insert profile record
    const result = await db.insert(profilesTable)
      .values({
        user_id: input.user_id,
        email: input.email || null,
        full_name: input.full_name || null,
        avatar_url: input.avatar_url || null
      })
      .returning()
      .execute();

    const profile = result[0];
    
    // Ensure timestamps are not null (they have default values)
    return {
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at!,
      updated_at: profile.updated_at!
    };
  } catch (error) {
    console.error('Profile creation failed:', error);
    throw error;
  }
};
