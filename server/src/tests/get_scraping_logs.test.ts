
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketplacesTable, scrapingSessionsTable } from '../db/schema';
import { getScrapingLogs } from '../handlers/get_scraping_logs';

describe('getScrapingLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no scraping sessions exist', async () => {
    const result = await getScrapingLogs();
    
    expect(result).toEqual([]);
  });

  it('should return scraping sessions ordered by started_at descending', async () => {
    // Create test marketplace first
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create test scraping sessions with different timestamps
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    await db.insert(scrapingSessionsTable).values([
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 10,
        started_at: twoDaysAgo,
        completed_at: twoDaysAgo,
        query: 'test query 1'
      },
      {
        marketplace_id: 1,
        status: 'failed',
        products_found: 0,
        started_at: now,
        completed_at: null,
        query: 'test query 2'
      },
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 5,
        started_at: yesterday,
        completed_at: yesterday,
        query: 'test query 3'
      }
    ]).execute();

    const result = await getScrapingLogs();

    expect(result).toHaveLength(3);
    // Should be ordered by started_at descending (most recent first)
    expect(result[0].started_at >= result[1].started_at).toBe(true);
    expect(result[1].started_at >= result[2].started_at).toBe(true);
    expect(result[0].query).toEqual('test query 2'); // Most recent
    expect(result[2].query).toEqual('test query 1'); // Oldest
  });

  it('should filter by status when provided', async () => {
    // Create test marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create sessions with different statuses
    await db.insert(scrapingSessionsTable).values([
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 10,
        started_at: new Date(),
        completed_at: new Date(),
        query: 'success query'
      },
      {
        marketplace_id: 1,
        status: 'failed',
        products_found: 0,
        started_at: new Date(),
        completed_at: null,
        query: 'failed query'
      },
      {
        marketplace_id: 1,
        status: 'skipped',
        products_found: null,
        started_at: new Date(),
        completed_at: new Date(),
        query: 'skipped query'
      }
    ]).execute();

    // Test filtering by 'Success' status
    const successResults = await getScrapingLogs(undefined, 'Success');
    expect(successResults).toHaveLength(1);
    expect(successResults[0].status).toEqual('completed');
    expect(successResults[0].query).toEqual('success query');

    // Test filtering by 'Failed' status
    const failedResults = await getScrapingLogs(undefined, 'Failed');
    expect(failedResults).toHaveLength(1);
    expect(failedResults[0].status).toEqual('failed');
    expect(failedResults[0].query).toEqual('failed query');

    // Test filtering by 'Skipped' status
    const skippedResults = await getScrapingLogs(undefined, 'Skipped');
    expect(skippedResults).toHaveLength(1);
    expect(skippedResults[0].status).toEqual('skipped');
    expect(skippedResults[0].query).toEqual('skipped query');
  });

  it('should filter by Discovery phase when provided', async () => {
    // Create test marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create sessions with and without queries
    await db.insert(scrapingSessionsTable).values([
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 10,
        started_at: new Date(),
        completed_at: new Date(),
        query: 'discovery query'
      },
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 5,
        started_at: new Date(),
        completed_at: new Date(),
        query: null // No query - enrichment type
      }
    ]).execute();

    // Test filtering by Discovery phase (sessions with queries)
    const discoveryResults = await getScrapingLogs('Discovery');
    expect(discoveryResults).toHaveLength(1);
    expect(discoveryResults[0].query).toEqual('discovery query');
  });

  it('should respect limit parameter', async () => {
    // Create test marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create multiple sessions
    const sessions = [];
    for (let i = 0; i < 10; i++) {
      sessions.push({
        marketplace_id: 1,
        status: 'completed',
        products_found: i,
        started_at: new Date(Date.now() + i * 1000), // Different timestamps
        completed_at: new Date(),
        query: `query ${i}`
      });
    }

    await db.insert(scrapingSessionsTable).values(sessions).execute();

    // Test with limit
    const limitedResults = await getScrapingLogs(undefined, undefined, 5);
    expect(limitedResults).toHaveLength(5);

    // Test default limit
    const defaultResults = await getScrapingLogs();
    expect(defaultResults).toHaveLength(10); // All results since less than default limit
  });

  it('should return all required fields correctly', async () => {
    // Create test marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    const testSession = {
      marketplace_id: 1,
      status: 'completed',
      products_found: 25,
      started_at: new Date(),
      completed_at: new Date(),
      query: 'test query'
    };

    await db.insert(scrapingSessionsTable).values(testSession).execute();

    const result = await getScrapingLogs();

    expect(result).toHaveLength(1);
    const log = result[0];
    
    expect(log.id).toBeDefined();
    expect(typeof log.id).toBe('number');
    expect(log.marketplace_id).toEqual(1);
    expect(log.status).toEqual('completed');
    expect(log.products_found).toEqual(25);
    expect(log.started_at).toBeInstanceOf(Date);
    expect(log.completed_at).toBeInstanceOf(Date);
    expect(log.query).toEqual('test query');
  });

  it('should handle null values correctly', async () => {
    // Create test marketplace
    await db.insert(marketplacesTable).values({
      id: 1,
      code: 'US',
      name: 'United States'
    }).execute();

    // Create session with null values
    await db.insert(scrapingSessionsTable).values({
      marketplace_id: 1,
      status: 'running',
      products_found: null,
      started_at: new Date(),
      completed_at: null,
      query: null
    }).execute();

    const result = await getScrapingLogs();

    expect(result).toHaveLength(1);
    const log = result[0];
    
    expect(log.products_found).toBeNull();
    expect(log.completed_at).toBeNull();
    expect(log.query).toBeNull();
    expect(log.started_at).toBeInstanceOf(Date); // This should not be null due to default
  });
});
