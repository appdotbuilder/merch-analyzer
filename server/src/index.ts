
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProductInputSchema, 
  getProductsInputSchema 
} from './schema';

// Import handlers
import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductByAsin } from './handlers/get_product_by_asin';
import { getMarketplaces } from './handlers/get_marketplaces';
import { getProductTypes } from './handlers/get_product_types';
import { getBrands } from './handlers/get_brands';
import { createBrand } from './handlers/create_brand';
import { getProductKeywords } from './handlers/get_product_keywords';
import { addProductKeyword } from './handlers/add_product_keyword';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Product operations
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),
    
  getProducts: publicProcedure
    .input(getProductsInputSchema.optional())
    .query(({ input }) => getProducts(input)),
    
  getProductByAsin: publicProcedure
    .input(z.string())
    .query(({ input }) => getProductByAsin(input)),
    
  // Marketplace operations
  getMarketplaces: publicProcedure
    .query(() => getMarketplaces()),
    
  // Product type operations
  getProductTypes: publicProcedure
    .query(() => getProductTypes()),
    
  // Brand operations
  getBrands: publicProcedure
    .query(() => getBrands()),
    
  createBrand: publicProcedure
    .input(z.string().min(1))
    .mutation(({ input }) => createBrand(input)),
    
  // Product keyword operations
  getProductKeywords: publicProcedure
    .input(z.number().int())
    .query(({ input }) => getProductKeywords(input)),
    
  addProductKeyword: publicProcedure
    .input(z.object({
      productId: z.number().int(),
      keyword: z.string().min(1)
    }))
    .mutation(({ input }) => addProductKeyword(input.productId, input.keyword)),
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
