          message: "Investor not found",
        });
      }

      // Check access rights
      const isSuperAdmin = ctx.user.role === "super_admin";
      if (!isSuperAdmin && investor.assignedAdminId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this investor",
        });
      }

      const properties = await db.getPropertiesByInvestorId(investor.id);
      const payments = await db.getPaymentsByInvestorId(investor.id);
      const cheques = await db.getChequesByInvestorId(investor.id);
      const documents = await db.getDocumentsByInvestorId(investor.id);

      return {
        investor,
        properties,
        payments,
        cheques,
        documents,
      };
    }),

  createInvestor: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        name: z.string(),
        email: z.string().email(),
        investorNumber: z.string(),
        phone: z.string().optional(),
        nationalId: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isSuperAdmin = ctx.user.role === "super_admin";
      
      await db.createInvestor({
        ...input,
        assignedAdminId: isSuperAdmin ? null : ctx.user.id,
      });

      await db.createActivityLog({
        userId: ctx.user.id,