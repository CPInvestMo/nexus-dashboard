import { initTRPC } from '@trpc/server';
import { z } from 'zod';

export interface Context {
  user?: {
    id: number;
    openId: string;
    email?: string;
    name?: string;
    role: 'super_admin' | 'internal_admin' | 'investor';
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check authentication
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new Error('Unauthorized');
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

// Middleware to check admin role
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin' && ctx.user.role !== 'internal_admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return next();
});

// Middleware to check super admin role
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'super_admin') {
    throw new Error('Forbidden: Super admin access required');
  }
  return next();
});
