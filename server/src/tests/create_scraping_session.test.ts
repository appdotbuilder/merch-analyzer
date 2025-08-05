
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scrapingSessionsTable, marketplacesTable } from '../db/schema';
import { createScrapingSession } from '../handlers/create_scraping_session';
import { eq } from 'drizzle-orm';

// Define input type inline since it's not in schema.ts yet
type CreateScrapingSessionInput = {
  marketplace_id: number;
  status?: string;
  query?: string;
  products_found?: number;
};

describe('createScrapingSession', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite marketplace data
    await db.insert(marketplacesTable)
      .values([
        { id: 1, code: 'US', name: 'United States' },
        { id: 2, code: 'UK', name: 'United Kingdom' },
        { id: 3, code: 'DE', name: 'Germany' }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should create a scraping session', async () => {
    const testInput: CreateScrapingSessionInput = {
      marketplace_id: 1,
      status: 'pending',
      query: 'test product search',
      products_found: 0
    };

    const result = await createScrapingSession(testInput);

    // Basic field validation
    expect(result.marketplace_id).toEqual(1);
    expect(result.status).toEqual('pending');
    expect(result.query).toEqual('test product search');
    expect(result.products_found).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should save scraping session to database', async () => {
    const testInput: CreateScrapingSessionInput = {
      marketplace_id: 1,
      status: 'pending',
      query: 'test product search',
      products_found: 0
    };

    const result = await createScrapingSession(testInput);

    // Query using proper drizzle syntax
    const sessions = await db.select()
      .from(scrapingSessionsTable)
      .where(eq(scrapingSessionsTable.id, result.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].marketplace_id).toEqual(1);
    expect(sessions[0].status).toEqual('pending');
    expect(sessions[0].query).toEqual('test product search');
    expect(sessions[0].products_found).toEqual(0);
    expect(sessions[0].started_at).toBeInstanceOf(Date);
    expect(sessions[0].completed_at).toBeNull();
  });

  it('should create session with minimal required fields', async () => {
    const minimalInput: CreateScrapingSessionInput = {
      marketplace_id: 2,
      status: 'running'
    };

    const result = await createScrapingSession(minimalInput);

    expect(result.marketplace_id).toEqual(2);
    expect(result.status).toEqual('running');
    expect(result.query).toBeNull();
    expect(result.products_found).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull();
  });

  it('should handle different status values', async () => {
    const statusTests = ['pending', 'running', 'completed', 'failed'];

    for (const status of statusTests) {
      const input: CreateScrapingSessionInput = {
        marketplace_id: 1,
        status: status,
        query: `test query for ${status}`
      };

      const result = await createScrapingSession(input);
      expect(result.status).toEqual(status);
      expect(result.query).toEqual(`test query for ${status}`);
    }
  });

  it('should handle products_found as null when not provided', async () => {
    const inputWithoutProductsFound: CreateScrapingSessionInput = {
      marketplace_id: 1,
      status: 'pending',
      query: 'test query'
    };

    const result = await createScrapingSession(inputWithoutProductsFound);

    expect(result.products_found).toBeNull();
    expect(result.marketplace_id).toEqual(1);
    expect(result.status).toEqual('pending');
    expect(result.query).toEqual('test query');
  });

  it('should create session with products_found value', async () => {
    const inputWithProductsFound: CreateScrapingSessionInput = {
      marketplace_id: 3,
      status: 'completed',
      query: 'successful search',
      products_found: 42
    };

    const result = await createScrapingSession(inputWithProductsFound);

    expect(result.products_found).toEqual(42);
    expect(result.marketplace_id).toEqual(3);
    expect(result.status).toEqual('completed');
    expect(result.query).toEqual('successful search');
  });

  it('should default to pending status when not provided', async () => {
    const inputWithoutStatus: CreateScrapingSessionInput = {
      marketplace_id: 1,
      query: 'test query'
    };

    const result = await createScrapingSession(inputWithoutStatus);

    expect(result.status).toEqual('pending');
    expect(result.marketplace_id).toEqual(1);
    expect(result.query).toEqual('test query');
  });

  it('should handle products_found value of zero correctly', async () => {
    const inputWithZero: CreateScrapingSessionInput = {
      marketplace_id: 1,
      status: 'completed',
      query: 'search with zero results',
      products_found: 0
    };

    const result = await createScrapingSession(inputWithZero);

    expect(result.products_found).toEqual(0);
    expect(result.marketplace_id).toEqual(1);
    expect(result.status).toEqual('completed');
    expect(result.query).toEqual('search with zero results');
  });
});
