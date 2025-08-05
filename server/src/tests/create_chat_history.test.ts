
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatHistoryTable, profilesTable } from '../db/schema';
import { createChatHistory } from '../handlers/create_chat_history';
import { eq } from 'drizzle-orm';

// Define input type inline since it's not exported from schema
type CreateChatHistoryInput = {
  user_id: string;
  message: string;
  response?: string;
};

// Test user ID
const testUserId = '550e8400-e29b-41d4-a716-446655440000';

// Simple test input
const testInput: CreateChatHistoryInput = {
  user_id: testUserId,
  message: 'Hello, can you help me find products?',
  response: 'Of course! I can help you search for products.'
};

describe('createChatHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create chat history with response', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createChatHistory(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUserId);
    expect(result.message).toEqual('Hello, can you help me find products?');
    expect(result.response).toEqual('Of course! I can help you search for products.');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create chat history without response', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const inputWithoutResponse: CreateChatHistoryInput = {
      user_id: testUserId,
      message: 'What are the trending products?'
    };

    const result = await createChatHistory(inputWithoutResponse);

    expect(result.user_id).toEqual(testUserId);
    expect(result.message).toEqual('What are the trending products?');
    expect(result.response).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save chat history to database', async () => {
    // Create prerequisite profile
    await db.insert(profilesTable)
      .values({
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      })
      .execute();

    const result = await createChatHistory(testInput);

    // Query using proper drizzle syntax
    const chatEntries = await db.select()
      .from(chatHistoryTable)
      .where(eq(chatHistoryTable.id, result.id))
      .execute();

    expect(chatEntries).toHaveLength(1);
    expect(chatEntries[0].user_id).toEqual(testUserId);
    expect(chatEntries[0].message).toEqual('Hello, can you help me find products?');
    expect(chatEntries[0].response).toEqual('Of course! I can help you search for products.');
    expect(chatEntries[0].created_at).toBeInstanceOf(Date);
  });

  it('should fail with invalid user_id foreign key', async () => {
    const invalidInput: CreateChatHistoryInput = {
      user_id: '00000000-0000-0000-0000-000000000000',
      message: 'This should fail'
    };

    await expect(createChatHistory(invalidInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
