import { inngest } from "@/lib/inngest/client";
import { anthropic } from "@/lib/ai/client";
import { buildReplanejarPrompt } from "@/lib/ai/prompts/replanejar-prompt";
import { planoGeradoSchema, type BlocoGerado } from "@/lib/ai/schemas/plano-schema";
import { db } from "@/server/db";

export const replanejarSemana = inngest.createFunction(
  {
    id: "replanejar-semana",
    retries: 2,
    concurrency: { limit: 5 },
    triggers: [{ cron: "0 23 * * 0" }],
  },
  async ({ step }) => {
    const alunosAtivos = await step.run("buscar-alunos-ativos", async () => {
      return db.matricula.findMany({
        where: {
          status: "PAGA",
          turma: { status: "EM_ANDAMENTO" },
        },
        include: {
          user: true,
          turma: { include: { carreira: true } },
        },
      });
    });

    const resultados = await Promise.all(
      alunosAtivos.map(async (matricula) => {
        const userId = matricula.userId;
        const turmaId = matricula.turmaId;

        return step.run(`replanejar-${userId}`, async () => {
          const agora = new Date();
          const cicloInicio = new Date(matricula.turma.cicloInicio);
          const diffMs = agora.getTime() - cicloInicio.getTime();
          const semanaAnterior = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));
          const semana = semanaAnterior + 1;

          if (semana > 12) return { userId, skipped: true, reason: "ciclo encerrado" };

          const inicioSemana = new Date(cicloInicio);
          inicioSemana.setDate(inicioSemana.getDate() + (semana - 1) * 7);
          const fimSemana = new Date(inicioSemana);
          fimSemana.setDate(fimSemana.getDate() + 6);

          const inicioSemanaAnterior = new Date(cicloInicio);
          inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() + (semanaAnterior - 1) * 7);
          const fimSemanaAnterior = new Date(inicioSemanaAnterior);
          fimSemanaAnterior.setDate(fimSemanaAnterior.getDate() + 6);
          fimSemanaAnterior.setHours(23, 59, 59, 999);

          const [diagnostico, execucoes, checkIn] = await Promise.all([
            db.diagnostico.findFirst({
              where: { userId },
              orderBy: { criadoEm: "desc" },
            }),
            db.execucao.findMany({
              where: {
                userId,
                data: { gte: inicioSemanaAnterior, lte: fimSemanaAnterior },
              },
            }),
            db.checkIn.findUnique({
              where: { userId_semana: { userId, semana: semanaAnterior } },
            }),
          ]);

          if (!diagnostico) return { userId, skipped: true, reason: "sem diagnóstico" };

          const prompt = buildReplanejarPrompt({
            diagnostico: { ...diagnostico, criadoEm: new Date(diagnostico.criadoEm) },
            execucoesSemana: execucoes.map((e) => ({
              ...e,
              data: new Date(e.data),
              criadoEm: new Date(e.criadoEm),
            })),
            semanaAnterior,
            semana,
            inicioSemana,
            fimSemana,
            carreira: matricula.turma.carreira.nome,
            checkInHumor: checkIn?.humor ?? undefined,
            checkInConsistencia: checkIn?.consistencia ?? undefined,
          });

          const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 4096,
            system: [
              {
                type: "text",
                text: "Você é um especialista em planejamento de estudos para concursos públicos brasileiros. Responda apenas com JSON válido.",
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: [{ role: "user", content: prompt }],
          });

          const content = response.content[0];
          if (!content || content.type !== "text") {
            throw new Error(`IA retornou resposta inválida para userId=${userId}`);
          }

          const planoGerado = planoGeradoSchema.parse(JSON.parse(content.text) as unknown);

          await db.plano.upsert({
            where: { userId_turmaId_semana: { userId, turmaId, semana } },
            update: { versao: { increment: 1 }, blocos: { deleteMany: { editadoPorMentor: false } } },
            create: { userId, turmaId, semana, inicioSemana, fimSemana, geradoPorIA: true },
          });

          const plano = await db.plano.findUniqueOrThrow({
            where: { userId_turmaId_semana: { userId, turmaId, semana } },
          });

          await db.bloco.createMany({
            data: planoGerado.blocos.map((b: BlocoGerado) => ({
              planoId: plano.id,
              data: new Date(b.data),
              materia: b.materia,
              topico: b.topico,
              tipo: b.tipo,
              duracaoMin: b.duracaoMin,
              prioridade: b.prioridade ?? 5,
              observacao: b.observacao ?? null,
            })),
          });

          return { userId, semana, blocos: planoGerado.blocos.length };
        });
      })
    );

    return { processados: resultados.length, resultados };
  }
);
