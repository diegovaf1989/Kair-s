import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

export const alunoRouter = createTRPCRouter({
  minhasTurmas: protectedProcedure.query(({ ctx }) => {
    return ctx.db.matricula.findMany({
      where: { userId: ctx.user.id, status: { in: ["PAGA", "PENDENTE"] } },
      include: { turma: { include: { carreira: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),
});
