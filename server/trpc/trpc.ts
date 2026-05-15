import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export async function createTRPCContext(opts: { req: NextRequest }) {
  const { userId: clerkId } = await auth();

  const user = clerkId
    ? await db.user.findUnique({ where: { clerkId } })
    : null;

  return {
    db,
    clerkId,
    user,
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.clerkId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      clerkId: ctx.clerkId,
      user: ctx.user,
    },
  });
});

export const mentorProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.clerkId || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.user.role !== "MENTOR" && ctx.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      ...ctx,
      clerkId: ctx.clerkId,
      user: ctx.user,
    },
  });
});
