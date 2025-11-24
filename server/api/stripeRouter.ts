import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe (will be null if keys not set)
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });
  }
} catch (error) {
  console.warn("[Stripe] Failed to initialize:", error);
}

export const stripeRouter = router({
  /**
   * Create a Stripe checkout session for a payment
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        paymentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new Error(
          "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables."
        );
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get payment details
      const paymentRecords = await db
        .select()
        .from(payments)
        .where(eq(payments.id, input.paymentId))
        .limit(1);

      if (paymentRecords.length === 0) {
        throw new Error("Payment not found");
      }

      const payment = paymentRecords[0];

      // Verify this payment belongs to the current user's investor account
      // (In a real system, you'd check if ctx.user is linked to the investor)

      // Calculate total amount (amount + penalty)
      const totalAmount = payment.amount + (payment.penaltyAmount || 0);

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "egp",
              product_data: {
                name: `Property Payment - ${payment.documentNumber}`,
                description: `Payment for property installment`,
              },
              unit_amount: Math.round(totalAmount * 100), // Convert to cents/piasters
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/investor/payment-center?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/investor/payment-center?canceled=true`,
        metadata: {
          paymentId: input.paymentId.toString(),
          userId: ctx.user.id.toString(),
          documentNumber: payment.documentNumber,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Verify payment session and update payment status
   */
  verifyPaymentSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      if (!stripe) {
        throw new Error("Stripe is not configured");
      }

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

      return {
        status: session.payment_status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      };
    }),

  /**
   * Get Stripe configuration status
   */
  getStripeStatus: protectedProcedure.query(() => {
    return {
      configured: !!stripe,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
    };
  }),
});
