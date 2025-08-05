
import { db } from '../db';
import { profilesTable } from '../db/schema';
import { type Profile } from '../schema';
import { eq } from 'drizzle-orm';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const results = await db.select()
      .from(profilesTable)
      .where(eq(profilesTable.user_id, userId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const profile = results[0];
    return {
      user_id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at!,
      updated_at: profile.updated_at!
    };
  } catch (error) {
    console.error('Profile retrieval failed:', error);
    throw error;
  }
};
