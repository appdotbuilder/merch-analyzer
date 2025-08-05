
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { scrapingSessionsTable, marketplacesTable } from '../db/schema';
import { updateScrapingSession } from '../handlers/update_scraping_session';
import { eq } from 'drizzle-orm';

describe('updateScrapingSession', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create prerequisite marketplaces
    await db.insert(marketplacesTable)
      .values([
        { id: 1, code: 'US', name: 'United States' },
        { id: 2, code: 'UK', name: 'United Kingdom' },
        { id: 3, code: 'DE', name: 'Germany' }
      ])
      .execute();
  });
  
  afterEach(resetDB);

  it('should update scraping session status', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 1,
        status: 'running',
        query: 'test query'
      })
      .returning()
      .execute();

    const result = await updateScrapingSession(session.id, {
      status: 'completed',
      products_found: 25
    });

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(session.id);
    expect(result!.status).toEqual('completed');
    expect(result!.products_found).toEqual(25);
    expect(result!.marketplace_id).toEqual(1);
    expect(result!.query).toEqual('test query');
    expect(result!.started_at).toBeInstanceOf(Date);
  });

  it('should update completion timestamp', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 2,
        status: 'running'
      })
      .returning()
      .execute();

    const completedAt = new Date();
    const result = await updateScrapingSession(session.id, {
      status: 'completed',
      completed_at: completedAt,
      products_found: 50
    });

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.completed_at).toBeInstanceOf(Date);
    expect(result!.completed_at!.getTime()).toBeCloseTo(completedAt.getTime(), -2);
    expect(result!.products_found).toEqual(50);
  });

  it('should update multiple fields at once', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 1,
        status: 'pending',
        query: 'original query'
      })
      .returning()
      .execute();

    const updates = {
      status: 'running' as const,
      products_found: 10,
      query: 'updated query'
    };

    const result = await updateScrapingSession(session.id, updates);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('running');
    expect(result!.products_found).toEqual(10);
    expect(result!.query).toEqual('updated query');
    expect(result!.marketplace_id).toEqual(1);
  });

  it('should persist changes to database', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 3,
        status: 'running'
      })
      .returning()
      .execute();

    await updateScrapingSession(session.id, {
      status: 'completed',
      products_found: 100
    });

    // Verify changes persisted
    const sessions = await db.select()
      .from(scrapingSessionsTable)
      .where(eq(scrapingSessionsTable.id, session.id))
      .execute();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].status).toEqual('completed');
    expect(sessions[0].products_found).toEqual(100);
    expect(sessions[0].started_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent session', async () => {
    const result = await updateScrapingSession(99999, {
      status: 'completed'
    });

    expect(result).toBeNull();
  });

  it('should handle partial updates correctly', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 1,
        status: 'running',
        products_found: 5,
        query: 'test query'
      })
      .returning()
      .execute();

    // Update only status
    const result = await updateScrapingSession(session.id, {
      status: 'paused'
    });

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('paused');
    expect(result!.products_found).toEqual(5); // Should remain unchanged
    expect(result!.query).toEqual('test query'); // Should remain unchanged
    expect(result!.marketplace_id).toEqual(1); // Should remain unchanged
  });

  it('should handle status transitions properly', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 2,
        status: 'pending'
      })
      .returning()
      .execute();

    // Transition to running
    const runningResult = await updateScrapingSession(session.id, {
      status: 'running'
    });
    expect(runningResult!.status).toEqual('running');

    // Transition to completed
    const completedResult = await updateScrapingSession(session.id, {
      status: 'completed',
      completed_at: new Date(),
      products_found: 75
    });
    expect(completedResult!.status).toEqual('completed');
    expect(completedResult!.completed_at).toBeInstanceOf(Date);
    expect(completedResult!.products_found).toEqual(75);
  });

  it('should handle null completion timestamp correctly', async () => {
    // Create test session
    const [session] = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: 1,
        status: 'running'
      })
      .returning()
      .execute();

    const result = await updateScrapingSession(session.id, {
      status: 'failed',
      completed_at: null
    });

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('failed');
    expect(result!.completed_at).toBeNull();
  });
});
