import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, mentorProcedure } from "@/server/trpc/trpc";
import { inngest } from "@/lib/inngest/client";

const REGENERAR_LIMITE = 2;

export const planoRouter = createTRPCRouter({
  getSemanaAtual: protectedProcedure
    .input(z.object({ turmaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const turma = await ctx.db.turma.findUnique({
        where: { id: input.turmaId },
      });
      if (!turma) throw new TRPCError({ code: "NOT_FOUND" });

      const agora = new Date();
      const diffMs = agora.getTime() - turma.cicloInicio.getTime();
      const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

      return ctx.db.plano.findUnique({
        where: {
          userId_turmaId_semana: {
            userId: ctx.user.id,
            turmaId: input.turmaId,
            semana: semanaAtual,
          },
        },
        include: { blocos: { orderBy: [{ data: "asc" }, { prioridade: "desc" }] } },
      });
    }),

  getSemana: protectedProcedure
    .input(z.object({ turmaId: z.string().cuid(), semana: z.number().int().min(1).max(12) }))
    .query(({ ctx, input }) => {
      return ctx.db.plano.findUnique({
        where: {
          userId_turmaId_semana: {
            userId: ctx.user.id,
            turmaId: input.turmaId,
            semana: input.semana,
          },
        },
        include: { blocos: { orderBy: [{ data: "asc" }, { prioridade: "desc" }] } },
      });
    }),

  regenerar: protectedProcedure
    .input(z.object({ turmaId: z.string().cuid(), semana: z.number().int().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const planoExistente = await ctx.db.plano.findUnique({
        where: {
          userId_turmaId_semana: {
            userId: ctx.user.id,
            turmaId: input.turmaId,
            semana: input.semana,
          },
        },
      });

      if (planoExistente && planoExistente.versao >= REGENERAR_LIMITE + 1) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Limite de ${REGENERAR_LIMITE} regenerações por semana atingido`,
        });
      }

      await inngest.send({
        name: "plano/gerar",
        data: {
          userId: ctx.user.id,
          turmaId: input.turmaId,
          semana: input.semana,
        },
      });

      return { ok: true };
    }),

  ajustarManual: mentorProcedure
    .input(
      z.object({
        blocoId: z.string().cuid(),
        materia: z.string().min(1).optional(),
        topico: z.string().optional(),
        duracaoMin: z.number().int().min(15).max(240).optional(),
        observacao: z.string().optional(),
        prioridade: z.number().int().min(0).max(10).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { blocoId, ...data } = input;
      return ctx.db.bloco.update({
        where: { id: blocoId },
        data: { ...data, editadoPorMentor: true },
      });
    }),
});
