
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scrapingSessionsTable, marketplacesTable } from '../db/schema';
import { getScrapingSessions } from '../handlers/get_scraping_sessions';

describe('getScrapingSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no scraping sessions exist', async () => {
    const result = await getScrapingSessions();
    expect(result).toEqual([]);
  });

  it('should return all scraping sessions with marketplace data', async () => {
    // Insert test marketplaces (should already exist from migration)
    await db.insert(marketplacesTable).values([
      { id: 1, code: 'US', name: 'United States' },
      { id: 2, code: 'UK', name: 'United Kingdom' }
    ]).onConflictDoNothing().execute();

    // Insert test scraping sessions
    const testSessions = [
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 150,
        query: 'test query 1',
        started_at: new Date('2024-01-15T09:00:00Z'),
        completed_at: new Date('2024-01-15T10:30:00Z')
      },
      {
        marketplace_id: 2,
        status: 'running',
        products_found: null,
        query: 'test query 2',
        started_at: new Date('2024-01-15T11:00:00Z'),
        completed_at: null
      }
    ];

    await db.insert(scrapingSessionsTable).values(testSessions).execute();

    const result = await getScrapingSessions();

    expect(result).toHaveLength(2);
    
    // Verify first session
    const session1 = result.find(s => s.marketplace_id === 1);
    expect(session1).toBeDefined();
    expect(session1!.status).toBe('completed');
    expect(session1!.products_found).toBe(150);
    expect(session1!.query).toBe('test query 1');
    expect(session1!.completed_at).toBeInstanceOf(Date);
    expect(session1!.started_at).toBeInstanceOf(Date);
    expect(session1!.id).toBeDefined();

    // Verify second session
    const session2 = result.find(s => s.marketplace_id === 2);
    expect(session2).toBeDefined();
    expect(session2!.status).toBe('running');
    expect(session2!.products_found).toBeNull();
    expect(session2!.query).toBe('test query 2');
    expect(session2!.completed_at).toBeNull();
    expect(session2!.started_at).toBeInstanceOf(Date);
    expect(session2!.id).toBeDefined();
  });

  it('should handle sessions with different statuses', async () => {
    // Insert test marketplaces
    await db.insert(marketplacesTable).values([
      { id: 1, code: 'US', name: 'United States' }
    ]).onConflictDoNothing().execute();

    // Insert sessions with various statuses
    const testSessions = [
      {
        marketplace_id: 1,
        status: 'pending',
        products_found: null,
        query: 'pending query',
        started_at: new Date('2024-01-15T08:00:00Z')
      },
      {
        marketplace_id: 1,
        status: 'failed',
        products_found: 0,
        query: 'failed query',
        started_at: new Date('2024-01-15T09:00:00Z'),
        completed_at: new Date('2024-01-15T09:30:00Z')
      },
      {
        marketplace_id: 1,
        status: 'completed',
        products_found: 500,
        query: 'successful query',
        started_at: new Date('2024-01-15T10:00:00Z'),
        completed_at: new Date('2024-01-15T11:00:00Z')
      }
    ];

    await db.insert(scrapingSessionsTable).values(testSessions).execute();

    const result = await getScrapingSessions();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(s => s.status).sort();
    expect(statuses).toEqual(['completed', 'failed', 'pending']);

    // Verify products_found handling
    const pendingSession = result.find(s => s.status === 'pending');
    expect(pendingSession!.products_found).toBeNull();

    const failedSession = result.find(s => s.status === 'failed');
    expect(failedSession!.products_found).toBe(0);

    const completedSession = result.find(s => s.status === 'completed');
    expect(completedSession!.products_found).toBe(500);

    // Verify all sessions have valid started_at
    result.forEach(session => {
      expect(session.started_at).toBeInstanceOf(Date);
    });
  });

  it('should only return sessions for valid marketplaces', async () => {
    // Insert test marketplace
    await db.insert(marketplacesTable).values([
      { id: 1, code: 'US', name: 'United States' }
    ]).onConflictDoNothing().execute();

    // Insert session for valid marketplace
    await db.insert(scrapingSessionsTable).values({
      marketplace_id: 1,
      status: 'completed',
      products_found: 100,
      query: 'valid marketplace query',
      started_at: new Date('2024-01-15T12:00:00Z')
    }).execute();

    const result = await getScrapingSessions();

    expect(result).toHaveLength(1);
    expect(result[0].marketplace_id).toBe(1);
    expect(result[0].query).toBe('valid marketplace query');
    expect(result[0].started_at).toBeInstanceOf(Date);
  });
});
