import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "./db";
import { notifyAdmin } from "./notifications";

// Initialize Stripe
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });
  }
} catch (error) {
  console.warn("[Stripe Webhook] Failed to initialize:", error);
}

/**
 * Handle Stripe webhook events
 * This endpoint should be registered in your Express app with raw body parsing
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not configured");
    return res.status(500).json({ error: "Stripe not configured" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    console.error("[Stripe Webhook] No signature found");
    return res.status(400).json({ error: "No signature" });
  }

  if (!webhookSecret) {
    console.warn("[Stripe Webhook] No webhook secret configured, skipping verification");
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } else {
      // For development/testing without webhook secret
      event = JSON.parse(req.body.toString());
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Checkout session completed: ${session.id}`);

  const paymentId = session.metadata?.paymentId;
  const userId = session.metadata?.userId;

  if (!paymentId) {
    console.warn("[Stripe Webhook] No paymentId in metadata");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  try {
    // Update payment status to Paid
    await db
      .update(payments)
      .set({
        status: "Paid",
        collectionDate: new Date(),
      })
      .where(eq(payments.id, parseInt(paymentId)));

    console.log(`[Stripe Webhook] Payment ${paymentId} marked as Paid`);

    // Send notification to investor
    if (userId) {
      await createNotification({
        userId: parseInt(userId),
        type: "payment_received",
        title: "Payment Received ✅",
        message: `Your payment has been successfully processed. Thank you!`,
        isRead: "false",
        metadata: JSON.stringify({
          paymentId,
          sessionId: session.id,
          amount: session.amount_total,
        }),
      });
    }

    // Notify admin
    await notifyAdmin({
      title: "Payment Received",
      content: `Payment ${paymentId} has been successfully processed via Stripe. Amount: ${session.amount_total ? (session.amount_total / 100).toFixed(2) : 'N/A'} ${session.currency?.toUpperCase()}`,
    });
  } catch (error) {
    console.error("[Stripe Webhook] Error updating payment:", error);
    throw error;
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment intent succeeded: ${paymentIntent.id}`);
  // Additional logic if needed
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] Payment intent failed: ${paymentIntent.id}`);

  // Notify admin of failed payment
  await notifyAdmin({
    title: "Payment Failed",
    content: `Payment intent ${paymentIntent.id} failed. Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}. Reason: ${paymentIntent.last_payment_error?.message || "Unknown"}`,
  });
}
