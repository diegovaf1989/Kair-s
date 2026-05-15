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

  listarAlunosDaTurma: mentorProcedure
    .input(z.object({ turmaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const turma = await ctx.db.turma.findUniqueOrThrow({
        where: { id: input.turmaId },
        select: { cicloInicio: true },
      });

      const agora = new Date();
      const diffMs = agora.getTime() - turma.cicloInicio.getTime();
      const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

      const inicioSemana = new Date(turma.cicloInicio);
      inicioSemana.setDate(inicioSemana.getDate() + (semanaAtual - 1) * 7);
      inicioSemana.setHours(0, 0, 0, 0);
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(fimSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      const matriculas = await ctx.db.matricula.findMany({
        where: { turmaId: input.turmaId },
        include: {
          user: {
            include: {
              execucoes: {
                where: { data: { gte: inicioSemana, lte: fimSemana } },
              },
              planos: {
                where: { turmaId: input.turmaId, semana: semanaAtual },
                include: { blocos: true },
              },
              checkIns: {
                where: { semana: semanaAtual },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return matriculas.map((m) => {
        const plano = m.user.planos[0];
        const totalPlanejadoMin = plano?.blocos.reduce((s, b) => s + b.duracaoMin, 0) ?? 0;
        const totalExecutadoMin = m.user.execucoes.reduce((s, e) => s + e.duracaoMin, 0);
        const percentExecucao =
          totalPlanejadoMin > 0
            ? Math.round((totalExecutadoMin / totalPlanejadoMin) * 100)
            : null;

        const status: "em_dia" | "atrasado" | "risco" =
          percentExecucao === null
            ? "risco"
            : percentExecucao >= 70
            ? "em_dia"
            : percentExecucao >= 40
            ? "atrasado"
            : "risco";

        return {
          matriculaId: m.id,
          userId: m.userId,
          nome: m.user.nome,
          email: m.user.email,
          whatsapp: m.user.whatsapp,
          matriculaStatus: m.status,
          percentExecucao,
          temPlano: !!plano,
          temCheckIn: m.user.checkIns.length > 0,
          status,
          totalMinutosExecutados: totalExecutadoMin,
          semanaAtual,
        };
      });
    }),

  getAlunoDetalhe: mentorProcedure
    .input(z.object({ userId: z.string().cuid(), turmaId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: input.userId },
        include: {
          diagnosticos: { orderBy: { criadoEm: "desc" }, take: 1 },
          planos: {
            where: { turmaId: input.turmaId },
            include: { blocos: { orderBy: [{ data: "asc" }, { prioridade: "desc" }] } },
            orderBy: { semana: "asc" },
          },
          execucoes: {
            orderBy: { data: "desc" },
            take: 50,
          },
          checkIns: { orderBy: { semana: "asc" } },
          mensagensRecebidas: {
            where: { remetenteId: ctx.user.id },
            orderBy: { criadoEm: "desc" },
            take: 20,
          },
        },
      });

      return user;
    }),

  enviarMensagem: mentorProcedure
    .input(
      z.object({
        destinatarioId: z.string().cuid(),
        conteudo: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const mensagem = await ctx.db.mensagem.create({
        data: {
          remetenteId: ctx.user.id,
          destinatarioId: input.destinatarioId,
          conteudo: input.conteudo,
        },
        include: { destinatario: true },
      });

      // Send email notification via Resend (best-effort, don't fail mutation)
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Kairós Aprovação <noreply@kairosaprovacao.com.br>",
          to: mensagem.destinatario.email,
          subject: "Nova mensagem do seu mentor",
          html: `
            <h2>Você recebeu uma mensagem do seu mentor</h2>
            <p>${input.conteudo.replace(/\n/g, "<br>")}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Ver no dashboard</a></p>
          `,
        });
      } catch (err) {
        console.error("Erro ao enviar email de mensagem:", err);
      }

      return mensagem;
    }),

  atualizarStatusTurma: mentorProcedure
    .input(
      z.object({
        turmaId: z.string().cuid(),
        status: z.enum(["RASCUNHO", "ABERTA", "EM_ANDAMENTO", "ENCERRADA"]),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.db.turma.update({
        where: { id: input.turmaId },
        data: { status: input.status },
      });
    }),
});
