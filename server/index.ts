import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './api/index';
import { ENV } from './_core/env';
import { handleStripeWebhook } from './routes/stripeWebhook';
import cors from 'cors';

const app = express();

// CORS configuration
app.use(cors({
  origin: ENV.isDev ? 'http://localhost:3000' : true,
  credentials: true,
}));

// Stripe webhook (must be before body parser)
app.post('/api/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Body parser for JSON
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// tRPC middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      // TODO: Extract user from session cookie
      // For now, return empty context
      return {
        user: undefined,
      };
    },
  })
);

// Start server
const port = ENV.port;
app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}`);
  console.log(`📊 tRPC endpoint: http://localhost:${port}/api/trpc`);
});

export { app };
