
import { db } from '../db';
import { excludedKeywordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ExcludedKeyword } from '../schema';

export const getExcludedKeywords = async (userId: string): Promise<ExcludedKeyword[]> => {
  try {
    const results = await db.select()
      .from(excludedKeywordsTable)
      .where(eq(excludedKeywordsTable.user_id, userId))
      .execute();

    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      keyword: result.keyword,
      created_at: result.created_at || new Date() // Handle potential null case
    }));
  } catch (error) {
    console.error('Failed to get excluded keywords:', error);
    throw error;
  }
};
