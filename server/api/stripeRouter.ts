import { router, protectedProcedure } from './trpc';
import { z } from 'zod';

export const stripeRouter = router({
  // Placeholder for Stripe endpoints
  
  createCheckoutSession: protectedProcedure
    .input(z.object({ 
      paymentId: z.number(),
      amount: z.number()
    }))
    .mutation(async ({ ctx, input }) => {
      return { url: 'https://stripe.com/mock-checkout' };
    }),
});
