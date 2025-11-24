import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const notificationRouter = router({
  /**
   * Get all notifications for the logged-in user
   */
  getMyNotifications: protectedProcedure.query(async ({ ctx }) => {
    return await db.getNotificationsByUserId(ctx.user.id);
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return await db.getUnreadNotificationCount(ctx.user.id);
  }),

  /**
   * Mark a specific notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),
});
