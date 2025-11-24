import { router, adminProcedure } from './trpc';
import { z } from 'zod';

export const adminRouter = router({
  // Placeholder for admin endpoints
  // These will be implemented with proper database connections
  
  test: adminProcedure
    .query(async () => {
      return { message: 'Admin API is working' };
    }),
});
