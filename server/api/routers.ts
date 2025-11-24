import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { adminRouter } from "./adminRouters";
import { stripeRouter } from "./stripeRouter";
import { notificationRouter } from "./notificationRouter";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  notifications: notificationRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Investor Portal Routes
  investor: router({
    // Get investor profile for logged-in user
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const investor = await db.getInvestorByUserId(ctx.user.id);
      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor profile not found. Please contact support.",
        });
      }
      return investor;
    }),

    // Get all properties owned by the logged-in investor
    getMyProperties: protectedProcedure.query(async ({ ctx }) => {
      const investor = await db.getInvestorByUserId(ctx.user.id);
      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor profile not found",
        });
      }
      
      const properties = await db.getPropertiesByInvestorId(investor.id);
      return properties;
    }),

    // Get detailed information about a specific property
    getPropertyDetails: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ ctx, input }) => {
        const investor = await db.getInvestorByUserId(ctx.user.id);
        if (!investor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Investor profile not found",
          });
        }

        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Property not found",
          });
        }

        // Ensure the investor owns this property
        if (property.investorId !== investor.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this property",
          });
        }

        // Get payment history for this property
        const payments = await db.getPaymentsByPropertyId(property.id);

        // Get documents for this property
        const documents = await db.getDocumentsByPropertyId(property.id);

        return {
          property,
          payments,
          documents,
        };
      }),

    // Get all payments for the logged-in investor
    getMyPayments: protectedProcedure.query(async ({ ctx }) => {
      const investor = await db.getInvestorByUserId(ctx.user.id);
      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor profile not found",
        });
      }

      const payments = await db.getPaymentsByInvestorId(investor.id);
      
      // Enrich payments with property information
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const property = await db.getPropertyById(payment.propertyId);
          return {
            ...payment,
            propertyName: property?.name || "Unknown Property",
          };
        })
      );

      return enrichedPayments;
    }),

    // Get all documents for the logged-in investor
    getMyDocuments: protectedProcedure.query(async ({ ctx }) => {
      const investor = await db.getInvestorByUserId(ctx.user.id);
      if (!investor) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Investor profile not found",
        });
      }

      const documents = await db.getDocumentsByInvestorId(investor.id);

      // Enrich documents with property information
      const enrichedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const property = doc.propertyId
            ? await db.getPropertyById(doc.propertyId)
            : null;
          return {
            ...doc,
            propertyName: property?.name || null,
          };
        })
      );

      return enrichedDocuments;
    }),

    // Get available properties for sale
    getAvailableProperties: protectedProcedure.query(async () => {
      const properties = await db.getAvailableProperties();
      return properties;
    }),

    // Submit a reservation for a property
    submitReservation: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const investor = await db.getInvestorByUserId(ctx.user.id);
        if (!investor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Investor profile not found",
          });
        }

        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Property not found",
          });
        }

        if (property.status !== "Available") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This property is not available for reservation",
          });
        }

        // Create the reservation
        await db.createReservation({
          propertyId: input.propertyId,
          investorId: investor.id,
          message: input.message || null,
          assignedAdminId: property.assignedAdminId || null,
          status: "Pending",
        });

        // Update property status to Reserved
        await db.updateProperty(input.propertyId, {
          status: "Reserved",
        });

        // Log the activity
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "Submitted property reservation",
          entityType: "reservation",
          entityId: input.propertyId,
          details: JSON.stringify({
            propertyName: property.name,
            investorName: investor.name,
          }),
        });

        return {
          success: true,
          message: "Reservation submitted successfully",
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
