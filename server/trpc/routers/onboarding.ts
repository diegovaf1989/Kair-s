import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";
import { inngest } from "@/lib/inngest/client";

const respostasSchema = z.object({
  carreiraAlvo: z.string().min(1),
  editaisAlvo: z.string().optional(),
  tempoEstudando: z.enum(["menos_6_meses", "6_a_12_meses", "mais_1_ano", "mais_2_anos"]),
  horasDiarias: z.number().min(1).max(12),
  diasDisponiveis: z.array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"])).min(1),
  pontosFracos: z.array(z.string()).optional(),
  pontosFortes: z.array(z.string()).optional(),
  ultimoEditalFeito: z.string().optional(),
  metaAprovacao: z.string().optional(),
  observacoes: z.string().optional(),
});

export const onboardingRouter = createTRPCRouter({
  salvarDiagnostico: protectedProcedure
    .input(respostasSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.diagnostico.create({
        data: {
          userId: ctx.user.id,
          respostas: input,
        },
      });
    }),

  completar: protectedProcedure
    .input(z.object({ turmaId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const matricula = await ctx.db.matricula.findUnique({
        where: {
          userId_turmaId: { userId: ctx.user.id, turmaId: input.turmaId },
        },
      });

      if (!matricula || matricula.status === "CANCELADA") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Matrícula não encontrada ou cancelada",
        });
      }

      const diagnostico = await ctx.db.diagnostico.findFirst({
        where: { userId: ctx.user.id },
        orderBy: { criadoEm: "desc" },
      });

      if (!diagnostico) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Complete o diagnóstico antes de finalizar o onboarding",
        });
      }

      await inngest.send({
        name: "plano/gerar",
        data: { userId: ctx.user.id, turmaId: input.turmaId, semana: 1 },
      });

      return { ok: true };
    }),
});
