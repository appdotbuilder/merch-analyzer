
import { db } from '../db';
import { scrapingSessionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ScrapingSession } from '../schema';

export const updateScrapingSession = async (
  id: number,
  updates: Partial<Omit<ScrapingSession, 'id'>>
): Promise<ScrapingSession | null> => {
  try {
    // Prepare update object with proper type conversions
    const updateData: any = {};
    
    if (updates.marketplace_id !== undefined) {
      updateData.marketplace_id = updates.marketplace_id;
    }
    
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    
    if (updates.products_found !== undefined) {
      updateData.products_found = updates.products_found;
    }
    
    if (updates.started_at !== undefined) {
      updateData.started_at = updates.started_at;
    }
    
    if (updates.completed_at !== undefined) {
      updateData.completed_at = updates.completed_at;
    }
    
    if (updates.query !== undefined) {
      updateData.query = updates.query;
    }

    const result = await db.update(scrapingSessionsTable)
      .set(updateData)
      .where(eq(scrapingSessionsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    const session = result[0];
    return {
      ...session,
      // Handle nullable date fields properly
      started_at: session.started_at || new Date(),
      completed_at: session.completed_at || null
    };
  } catch (error) {
    console.error('Scraping session update failed:', error);
    throw error;
  }
};
