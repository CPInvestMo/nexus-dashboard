import { router } from './trpc';
import { investorRouter } from './routers';
import { adminRouter } from './adminRouters';
import { notificationRouter } from './notificationRouter';
import { stripeRouter } from './stripeRouter';

export const appRouter = router({
  investor: investorRouter,
  admin: adminRouter,
  notifications: notificationRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
