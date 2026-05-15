import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

const registrarInput = z.object({
  blocoId: z.string().cuid().optional(),
  data: z.coerce.date(),
  materia: z.string().min(1),
  topico: z.string().optional(),
  duracaoMin: z.number().int().min(1).max(600),
  questoesTotal: z.number().int().min(0).optional(),
  questoesAcerto: z.number().int().min(0).optional(),
  sensacaoDominio: z.number().int().min(1).max(5).optional(),
  observacao: z.string().max(500).optional(),
});

export const execucaoRouter = createTRPCRouter({
  registrar: protectedProcedure
    .input(registrarInput)
    .mutation(({ ctx, input }) => {
      return ctx.db.execucao.create({
        data: { userId: ctx.user.id, ...input },
      });
    }),

  listarDoDia: protectedProcedure
    .input(z.object({ data: z.coerce.date() }))
    .query(({ ctx, input }) => {
      const inicio = new Date(input.data);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(input.data);
      fim.setHours(23, 59, 59, 999);

      return ctx.db.execucao.findMany({
        where: { userId: ctx.user.id, data: { gte: inicio, lte: fim } },
        include: { bloco: true },
        orderBy: { criadoEm: "desc" },
      });
    }),

  listarSemana: protectedProcedure
    .input(z.object({ inicioSemana: z.coerce.date() }))
    .query(({ ctx, input }) => {
      const inicio = new Date(input.inicioSemana);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(input.inicioSemana);
      fim.setDate(fim.getDate() + 6);
      fim.setHours(23, 59, 59, 999);

      return ctx.db.execucao.findMany({
        where: { userId: ctx.user.id, data: { gte: inicio, lte: fim } },
        include: { bloco: true },
        orderBy: { data: "asc" },
      });
    }),
});
