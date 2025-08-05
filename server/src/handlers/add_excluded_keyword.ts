
import { db } from '../db';
import { excludedKeywordsTable } from '../db/schema';
import { type ExcludedKeyword } from '../schema';

// Input type based on the excludedKeyword schema structure
export interface AddExcludedKeywordInput {
  user_id: string;
  keyword: string;
}

export const addExcludedKeyword = async (input: AddExcludedKeywordInput): Promise<ExcludedKeyword> => {
  try {
    // Insert excluded keyword record
    const result = await db.insert(excludedKeywordsTable)
      .values({
        user_id: input.user_id,
        keyword: input.keyword
      })
      .returning()
      .execute();

    const excludedKeyword = result[0];
    return {
      id: excludedKeyword.id,
      user_id: excludedKeyword.user_id,
      keyword: excludedKeyword.keyword,
      created_at: excludedKeyword.created_at || new Date() // Handle potential null
    };
  } catch (error) {
    console.error('Excluded keyword creation failed:', error);
    throw error;
  }
};
