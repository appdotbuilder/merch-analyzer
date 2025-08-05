
import { db } from '../db';
import { excludedKeywordsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface RemoveExcludedKeywordInput {
  user_id: string;
  keyword: string;
}

export const removeExcludedKeyword = async (input: RemoveExcludedKeywordInput): Promise<void> => {
  try {
    await db.delete(excludedKeywordsTable)
      .where(
        and(
          eq(excludedKeywordsTable.user_id, input.user_id),
          eq(excludedKeywordsTable.keyword, input.keyword)
        )
      )
      .execute();
  } catch (error) {
    console.error('Failed to remove excluded keyword:', error);
    throw error;
  }
};
