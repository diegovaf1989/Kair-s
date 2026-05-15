import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        nome: z.string().min(2).max(100),
        whatsapp: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
});
