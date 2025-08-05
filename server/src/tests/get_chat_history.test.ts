
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chatHistoryTable, profilesTable } from '../db/schema';
import { getChatHistory } from '../handlers/get_chat_history';

const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const testUserId2 = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

describe('getChatHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no chat history', async () => {
    // Create user profile first
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    });

    const result = await getChatHistory(testUserId);

    expect(result).toEqual([]);
  });

  it('should return chat history for specific user', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    });

    // Create chat history entries with delays to ensure proper ordering
    await db.insert(chatHistoryTable).values({
      user_id: testUserId,
      message: 'Hello, how are you?',
      response: 'I am doing well, thank you!'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(chatHistoryTable).values({
      user_id: testUserId,
      message: 'What is the weather like?',
      response: 'I do not have access to weather data.'
    });

    const result = await getChatHistory(testUserId);

    expect(result).toHaveLength(2);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].message).toEqual('What is the weather like?'); // Most recent first
    expect(result[0].response).toEqual('I do not have access to weather data.');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].message).toEqual('Hello, how are you?');
    expect(result[1].response).toEqual('I am doing well, thank you!');
  });

  it('should return only chat history for specified user', async () => {
    // Create two user profiles
    await db.insert(profilesTable).values([
      {
        user_id: testUserId,
        email: 'test1@example.com',
        full_name: 'Test User 1'
      },
      {
        user_id: testUserId2,
        email: 'test2@example.com',
        full_name: 'Test User 2'
      }
    ]);

    // Create chat history for both users
    await db.insert(chatHistoryTable).values([
      {
        user_id: testUserId,
        message: 'User 1 message',
        response: 'User 1 response'
      },
      {
        user_id: testUserId2,
        message: 'User 2 message',
        response: 'User 2 response'
      }
    ]);

    const result = await getChatHistory(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUserId);
    expect(result[0].message).toEqual('User 1 message');
    expect(result[0].response).toEqual('User 1 response');
  });

  it('should handle chat history with null response', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    });

    // Create chat history entry with null response
    await db.insert(chatHistoryTable).values({
      user_id: testUserId,
      message: 'Pending message',
      response: null
    });

    const result = await getChatHistory(testUserId);

    expect(result).toHaveLength(1);
    expect(result[0].message).toEqual('Pending message');
    expect(result[0].response).toBeNull();
  });

  it('should return results ordered by created_at descending', async () => {
    // Create user profile
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    });

    // Create multiple chat entries
    const entries = [
      {
        user_id: testUserId,
        message: 'First message',
        response: 'First response'
      },
      {
        user_id: testUserId,
        message: 'Second message',
        response: 'Second response'
      },
      {
        user_id: testUserId,
        message: 'Third message',
        response: 'Third response'
      }
    ];

    // Insert entries with small delays to ensure different timestamps
    for (const entry of entries) {
      await db.insert(chatHistoryTable).values(entry);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getChatHistory(testUserId);

    expect(result).toHaveLength(3);
    expect(result[0].message).toEqual('Third message'); // Most recent
    expect(result[1].message).toEqual('Second message');
    expect(result[2].message).toEqual('First message'); // Oldest

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });
});
