import { router, protectedProcedure } from './trpc';
import { z } from 'zod';

export const investorRouter = router({
  // Placeholder for investor endpoints
  // These will be implemented with proper database connections
  
  test: protectedProcedure
    .query(async () => {
      return { message: 'Investor API is working' };
    }),
});
