
import { db } from '../db';
import { scrapingSessionsTable } from '../db/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';

// Define ScrapingLog type based on scraping_sessions table structure
export type ScrapingLog = {
  id: number;
  marketplace_id: number;
  status: string;
  products_found: number | null;
  started_at: Date;
  completed_at: Date | null;
  query: string | null;
};

export async function getScrapingLogs(
  phase?: 'Discovery' | 'Enrichment',
  status?: 'Success' | 'Failed' | 'Skipped',
  limit: number = 100
): Promise<ScrapingLog[]> {
  try {
    // Build the base query with all conditions at once
    const conditions = [];

    // Map phase to status patterns (since we don't have a phase column)
    if (phase === 'Discovery') {
      // Discovery phase might be sessions with query field populated
      conditions.push(isNotNull(scrapingSessionsTable.query));
    }

    // Filter by status if provided
    if (status) {
      // Map the provided status to database status values
      let dbStatus: string;
      switch (status) {
        case 'Success':
          dbStatus = 'completed';
          break;
        case 'Failed':
          dbStatus = 'failed';
          break;
        case 'Skipped':
          dbStatus = 'skipped';
          break;
        default:
          // This should never happen given the type constraint, but handle it safely
          dbStatus = 'completed';
          break;
      }
      conditions.push(eq(scrapingSessionsTable.status, dbStatus));
    }

    // Build the final query
    const baseQuery = db.select().from(scrapingSessionsTable);
    
    const finalQuery = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    const results = await finalQuery
      .orderBy(desc(scrapingSessionsTable.started_at))
      .limit(limit)
      .execute();

    // Return results mapped to ScrapingLog type
    return results.map(result => ({
      id: result.id,
      marketplace_id: result.marketplace_id,
      status: result.status,
      products_found: result.products_found,
      started_at: result.started_at!, // Non-null assertion since started_at has default
      completed_at: result.completed_at,
      query: result.query
    }));
  } catch (error) {
    console.error('Failed to fetch scraping logs:', error);
    throw error;
  }
}
