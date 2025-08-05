
import { db } from '../db';
import { scrapingSessionsTable, marketplacesTable } from '../db/schema';
import { type ScrapingSession } from '../schema';
import { eq } from 'drizzle-orm';

export const getScrapingSessions = async (): Promise<ScrapingSession[]> => {
  try {
    // Join scraping sessions with marketplaces to get complete data
    const results = await db.select({
      id: scrapingSessionsTable.id,
      marketplace_id: scrapingSessionsTable.marketplace_id,
      status: scrapingSessionsTable.status,
      products_found: scrapingSessionsTable.products_found,
      started_at: scrapingSessionsTable.started_at,
      completed_at: scrapingSessionsTable.completed_at,
      query: scrapingSessionsTable.query
    })
    .from(scrapingSessionsTable)
    .innerJoin(marketplacesTable, eq(scrapingSessionsTable.marketplace_id, marketplacesTable.id))
    .execute();

    return results.map(session => ({
      id: session.id,
      marketplace_id: session.marketplace_id,
      status: session.status,
      products_found: session.products_found,
      started_at: session.started_at || new Date(), // Handle potential null with fallback
      completed_at: session.completed_at,
      query: session.query
    }));
  } catch (error) {
    console.error('Failed to fetch scraping sessions:', error);
    throw error;
  }
};
