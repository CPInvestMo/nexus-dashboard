import { router, protectedProcedure } from './trpc';
import { z } from 'zod';

export const notificationRouter = router({
  // Placeholder for notification endpoints
  
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      // Return empty array for now
      return [];
    }),
    
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      // Return 0 for now
      return 0;
    }),
    
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return { success: true };
    }),
    
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      return { success: true };
    }),
});
