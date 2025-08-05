
import { db } from '../db';
import { scrapingSessionsTable } from '../db/schema';
import { type ScrapingSession } from '../schema';

// Define input type inline since it's not in schema.ts yet
type CreateScrapingSessionInput = {
  marketplace_id: number;
  status?: string;
  query?: string;
  products_found?: number;
};

export const createScrapingSession = async (input: CreateScrapingSessionInput): Promise<ScrapingSession> => {
  try {
    // Insert scraping session record
    const result = await db.insert(scrapingSessionsTable)
      .values({
        marketplace_id: input.marketplace_id,
        status: input.status || 'pending',
        query: input.query || null,
        products_found: input.products_found !== undefined ? input.products_found : null
      })
      .returning()
      .execute();

    const session = result[0];
    return {
      ...session,
      // Ensure started_at is always a Date (it has defaultNow() in schema)
      started_at: session.started_at || new Date()
    };
  } catch (error) {
    console.error('Scraping session creation failed:', error);
    throw error;
  }
};
