import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
