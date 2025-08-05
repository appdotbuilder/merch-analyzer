
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { excludedBrandsTable, brandsTable, profilesTable } from '../db/schema';
import { removeExcludedBrand, type RemoveExcludedBrandInput } from '../handlers/remove_excluded_brand';
import { eq, and } from 'drizzle-orm';

const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const testBrandId = 1;

const testInput: RemoveExcludedBrandInput = {
  user_id: testUserId,
  brand_id: testBrandId
};

describe('removeExcludedBrand', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove an excluded brand', async () => {
    // Create prerequisite data
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    await db.insert(brandsTable).values({
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).execute();

    // Create excluded brand record
    await db.insert(excludedBrandsTable).values({
      user_id: testUserId,
      brand_id: testBrandId
    }).execute();

    // Verify the excluded brand exists
    const beforeRemoval = await db.select()
      .from(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, testUserId),
          eq(excludedBrandsTable.brand_id, testBrandId)
        )
      )
      .execute();

    expect(beforeRemoval).toHaveLength(1);

    // Remove the excluded brand
    await removeExcludedBrand(testInput);

    // Verify the excluded brand is removed
    const afterRemoval = await db.select()
      .from(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, testUserId),
          eq(excludedBrandsTable.brand_id, testBrandId)
        )
      )
      .execute();

    expect(afterRemoval).toHaveLength(0);
  });

  it('should handle removing non-existent excluded brand gracefully', async () => {
    // Create prerequisite data
    await db.insert(profilesTable).values({
      user_id: testUserId,
      email: 'test@example.com',
      full_name: 'Test User'
    }).execute();

    await db.insert(brandsTable).values({
      name: 'Test Brand',
      normalized_name: 'test brand'
    }).execute();

    // Try to remove non-existent excluded brand (should not throw error)
    await expect(removeExcludedBrand(testInput)).resolves.toBeUndefined();

    // Verify no excluded brands exist
    const excludedBrands = await db.select()
      .from(excludedBrandsTable)
      .where(eq(excludedBrandsTable.user_id, testUserId))
      .execute();

    expect(excludedBrands).toHaveLength(0);
  });

  it('should only remove the specific user-brand combination', async () => {
    const otherUserId = 'a47ac10b-58cc-4372-a567-0e02b2c3d480';
    const otherBrandId = 2;

    // Create prerequisite data
    await db.insert(profilesTable).values([
      {
        user_id: testUserId,
        email: 'test@example.com',
        full_name: 'Test User'
      },
      {
        user_id: otherUserId,
        email: 'other@example.com',
        full_name: 'Other User'
      }
    ]).execute();

    await db.insert(brandsTable).values([
      {
        name: 'Test Brand',
        normalized_name: 'test brand'
      },
      {
        name: 'Other Brand',
        normalized_name: 'other brand'
      }
    ]).execute();

    // Get the actual brand IDs from the database since they're auto-generated
    const brands = await db.select().from(brandsTable).execute();
    const testBrand = brands.find(b => b.name === 'Test Brand')!;
    const otherBrand = brands.find(b => b.name === 'Other Brand')!;

    // Create multiple excluded brand records
    await db.insert(excludedBrandsTable).values([
      {
        user_id: testUserId,
        brand_id: testBrand.id
      },
      {
        user_id: testUserId,
        brand_id: otherBrand.id
      },
      {
        user_id: otherUserId,
        brand_id: testBrand.id
      }
    ]).execute();

    // Remove specific excluded brand
    await removeExcludedBrand({
      user_id: testUserId,
      brand_id: testBrand.id
    });

    // Verify only the specific record was removed
    const remainingExcludedBrands = await db.select()
      .from(excludedBrandsTable)
      .execute();

    expect(remainingExcludedBrands).toHaveLength(2);

    // Verify the correct record was removed
    const targetRecord = await db.select()
      .from(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, testUserId),
          eq(excludedBrandsTable.brand_id, testBrand.id)
        )
      )
      .execute();

    expect(targetRecord).toHaveLength(0);

    // Verify other records still exist
    const otherUserRecord = await db.select()
      .from(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, otherUserId),
          eq(excludedBrandsTable.brand_id, testBrand.id)
        )
      )
      .execute();

    expect(otherUserRecord).toHaveLength(1);

    const sameUserOtherBrandRecord = await db.select()
      .from(excludedBrandsTable)
      .where(
        and(
          eq(excludedBrandsTable.user_id, testUserId),
          eq(excludedBrandsTable.brand_id, otherBrand.id)
        )
      )
      .execute();

    expect(sameUserOtherBrandRecord).toHaveLength(1);
  });
});
