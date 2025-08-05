
import { db } from '../db';
import { chatHistoryTable } from '../db/schema';
import { type ChatHistory } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getChatHistory = async (userId: string): Promise<ChatHistory[]> => {
  try {
    const results = await db.select()
      .from(chatHistoryTable)
      .where(eq(chatHistoryTable.user_id, userId))
      .orderBy(desc(chatHistoryTable.created_at))
      .execute();

    return results.map(result => ({
      ...result,
      created_at: result.created_at || new Date() // Handle potential null created_at
    }));
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    throw error;
  }
};
