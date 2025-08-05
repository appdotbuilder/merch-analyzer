
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Schema imports
import { 
  createProductInputSchema, 
  updateProductInputSchema, 
  productFilterSchema,
  createUserPreferenceInputSchema,
  createFavoriteGroupInputSchema,
  addProductToGroupInputSchema,
  createScrapingLogInputSchema
} from './schema';

// Handler imports
import { createProduct } from './handlers/create_product';
import { updateProduct } from './handlers/update_product';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { getProductByAsin } from './handlers/get_product_by_asin';
import { recordBsrHistory } from './handlers/record_bsr_history';
import { recordPriceHistory } from './handlers/record_price_history';
import { recordReviewHistory } from './handlers/record_review_history';
import { getBsrHistory } from './handlers/get_bsr_history';
import { getPriceHistory } from './handlers/get_price_history';
import { getReviewHistory } from './handlers/get_review_history';
import { createUserPreference } from './handlers/create_user_preference';
import { getUserPreference } from './handlers/get_user_preference';
import { createFavoriteGroup } from './handlers/create_favorite_group';
import { getFavoriteGroups } from './handlers/get_favorite_groups';
import { addProductToGroup } from './handlers/add_product_to_group';
import { removeProductFromGroup } from './handlers/remove_product_from_group';
import { getGroupProducts } from './handlers/get_group_products';
import { createScrapingLog } from './handlers/create_scraping_log';
import { getScrapingLogs } from './handlers/get_scraping_logs';
import { z } from 'zod';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  getProducts: publicProcedure
    .input(productFilterSchema.optional())
    .query(({ input }) => getProducts(input)),

  getProductById: publicProcedure
    .input(z.number())
    .query(({ input }) => getProductById(input)),

  getProductByAsin: publicProcedure
    .input(z.object({ 
      asin: z.string(), 
      marketplace: z.enum(['USA', 'UK', 'Germany']) 
    }))
    .query(({ input }) => getProductByAsin(input.asin, input.marketplace)),

  // Historical data management
  recordBsrHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      bsr: z.number().int(),
      bsrCategory: z.string()
    }))
    .mutation(({ input }) => recordBsrHistory(input.productId, input.bsr, input.bsrCategory)),

  recordPriceHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      price: z.number(),
      currency: z.string()
    }))
    .mutation(({ input }) => recordPriceHistory(input.productId, input.price, input.currency)),

  recordReviewHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      rating: z.number(),
      reviewCount: z.number().int()
    }))
    .mutation(({ input }) => recordReviewHistory(input.productId, input.rating, input.reviewCount)),

  getBsrHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      days: z.number().optional()
    }))
    .query(({ input }) => getBsrHistory(input.productId, input.days)),

  getPriceHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      days: z.number().optional()
    }))
    .query(({ input }) => getPriceHistory(input.productId, input.days)),

  getReviewHistory: publicProcedure
    .input(z.object({
      productId: z.number(),
      days: z.number().optional()
    }))
    .query(({ input }) => getReviewHistory(input.productId, input.days)),

  // User preferences
  createUserPreference: publicProcedure
    .input(createUserPreferenceInputSchema)
    .mutation(({ input }) => createUserPreference(input)),

  getUserPreference: publicProcedure
    .input(z.string())
    .query(({ input }) => getUserPreference(input)),

  // Favorite groups
  createFavoriteGroup: publicProcedure
    .input(createFavoriteGroupInputSchema)
    .mutation(({ input }) => createFavoriteGroup(input)),

  getFavoriteGroups: publicProcedure
    .input(z.string())
    .query(({ input }) => getFavoriteGroups(input)),

  addProductToGroup: publicProcedure
    .input(addProductToGroupInputSchema)
    .mutation(({ input }) => addProductToGroup(input)),

  removeProductFromGroup: publicProcedure
    .input(z.object({
      groupId: z.number(),
      productId: z.number()
    }))
    .mutation(({ input }) => removeProductFromGroup(input.groupId, input.productId)),

  getGroupProducts: publicProcedure
    .input(z.number())
    .query(({ input }) => getGroupProducts(input)),

  // Scraping logs
  createScrapingLog: publicProcedure
    .input(createScrapingLogInputSchema)
    .mutation(({ input }) => createScrapingLog(input)),

  getScrapingLogs: publicProcedure
    .input(z.object({
      phase: z.enum(['Discovery', 'Enrichment']).optional(),
      status: z.enum(['Success', 'Failed', 'Skipped']).optional(),
      limit: z.number().default(100)
    }))
    .query(({ input }) => getScrapingLogs(input.phase, input.status, input.limit)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
