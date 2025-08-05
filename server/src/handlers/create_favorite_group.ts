
import { db } from '../db';
import { favoriteGroupsTable } from '../db/schema';
import { type FavoriteGroup } from '../schema';

export interface CreateFavoriteGroupInput {
  user_id: string;
  name: string;
}

export const createFavoriteGroup = async (input: CreateFavoriteGroupInput): Promise<FavoriteGroup> => {
  try {
    // Insert favorite group record
    const result = await db.insert(favoriteGroupsTable)
      .values({
        user_id: input.user_id,
        name: input.name
      })
      .returning()
      .execute();

    const favoriteGroup = result[0];
    
    // Handle nullable timestamps by providing defaults
    return {
      ...favoriteGroup,
      created_at: favoriteGroup.created_at || new Date(),
      updated_at: favoriteGroup.updated_at || new Date()
    };
  } catch (error) {
    console.error('Favorite group creation failed:', error);
    throw error;
  }
};
