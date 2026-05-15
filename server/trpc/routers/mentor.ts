import { z } from "zod";
import { createTRPCRouter, mentorProcedure } from "@/server/trpc/trpc";

const criarTurmaInput = z.object({
  nome: z.string().min(2).max(100),
  carreiraId: z.string().cuid(),
  cicloInicio: z.coerce.date(),
  cicloFim: z.coerce.date(),
  precoCentavos: z.number().int().positive(),
  vagas: z.number().int().positive().max(200),
});

export const mentorRouter = createTRPCRouter({
  listarTurmas: mentorProcedure.query(({ ctx }) => {
    return ctx.db.turma.findMany({
      include: { carreira: true, _count: { select: { matriculas: true } } },
      orderBy: { cicloInicio: "desc" },
    });
  }),

  getTurma: mentorProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.turma.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          carreira: true,
          matriculas: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  criarTurma: mentorProcedure
    .input(criarTurmaInput)
    .mutation(({ ctx, input }) => {
      return ctx.db.turma.create({ data: input });
    }),

  listarCarreiras: mentorProcedure.query(({ ctx }) => {
    return ctx.db.carreira.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
    });
  }),
});
