
import { db } from '../db';
import { favoriteGroupsTable } from '../db/schema';
import { type FavoriteGroup } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getFavoriteGroups = async (userId: string): Promise<FavoriteGroup[]> => {
  try {
    const results = await db.select()
      .from(favoriteGroupsTable)
      .where(eq(favoriteGroupsTable.user_id, userId))
      .orderBy(desc(favoriteGroupsTable.created_at))
      .execute();

    return results.map(result => ({
      ...result,
      created_at: result.created_at || new Date(),
      updated_at: result.updated_at || new Date()
    }));
  } catch (error) {
    console.error('Get favorite groups failed:', error);
    throw error;
  }
};
