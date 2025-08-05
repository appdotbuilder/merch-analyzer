
import { db } from '../db';
import { chatHistoryTable } from '../db/schema';
import { type ChatHistory } from '../schema';

// Define input type inline since it's not exported from schema
type CreateChatHistoryInput = {
  user_id: string;
  message: string;
  response?: string;
};

export const createChatHistory = async (input: CreateChatHistoryInput): Promise<ChatHistory> => {
  try {
    // Insert chat history record
    const result = await db.insert(chatHistoryTable)
      .values({
        user_id: input.user_id,
        message: input.message,
        response: input.response || null
      })
      .returning()
      .execute();

    const chatHistory = result[0];
    return {
      id: chatHistory.id,
      user_id: chatHistory.user_id,
      message: chatHistory.message,
      response: chatHistory.response || null,
      created_at: chatHistory.created_at!
    };
  } catch (error) {
    console.error('Chat history creation failed:', error);
    throw error;
  }
};
