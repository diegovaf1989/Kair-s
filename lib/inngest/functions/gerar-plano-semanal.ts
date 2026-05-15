import { inngest } from "@/lib/inngest/client";
import { anthropic } from "@/lib/ai/client";
import { buildPlanoPrompt } from "@/lib/ai/prompts/plano-prompt";
import { planoGeradoSchema, type BlocoGerado } from "@/lib/ai/schemas/plano-schema";
import { db } from "@/server/db";

export const gerarPlanoSemanal = inngest.createFunction(
  {
    id: "gerar-plano-semanal",
    retries: 2,
    triggers: [{ event: "plano/gerar" }],
  },
  async ({ event, step }) => {
    const { userId, turmaId, semana } = event.data as {
      userId: string;
      turmaId: string;
      semana: number;
    };

    const data = await step.run("buscar-dados", async () => {
      const [user, turma, diagnostico] = await Promise.all([
        db.user.findUniqueOrThrow({ where: { id: userId } }),
        db.turma.findUniqueOrThrow({
          where: { id: turmaId },
          include: { carreira: true },
        }),
        db.diagnostico.findFirst({
          where: { userId },
          orderBy: { criadoEm: "desc" },
        }),
      ]);
      return { user, turma, diagnostico };
    });

    if (!data.diagnostico) {
      throw new Error(`Diagnóstico não encontrado para userId=${userId}`);
    }

    const inicioSemana = new Date(data.turma.cicloInicio);
    inicioSemana.setDate(inicioSemana.getDate() + (semana - 1) * 7);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const planoGerado = await step.run("chamar-ia", async () => {
      const diagnosticoRaw = data.diagnostico!;
      // step.run serializes dates to strings; reconstruct the Date for type compatibility
      const diagnostico = {
        ...diagnosticoRaw,
        criadoEm: new Date(diagnosticoRaw.criadoEm),
      };
      const prompt = buildPlanoPrompt({
        diagnostico,
        semana,
        inicioSemana,
        fimSemana,
        carreira: data.turma.carreira.nome,
      });

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const content = response.content[0];
      if (!content || content.type !== "text") {
        throw new Error("Resposta da IA inválida");
      }

      const parsed = JSON.parse(content.text) as unknown;
      return planoGeradoSchema.parse(parsed);
    });

    await step.run("salvar-plano", async () => {
      await db.plano.upsert({
        where: { userId_turmaId_semana: { userId, turmaId, semana } },
        update: {
          versao: { increment: 1 },
          blocos: { deleteMany: { editadoPorMentor: false } },
          geradoPorIA: true,
          promptUsado: null,
        },
        create: {
          userId,
          turmaId,
          semana,
          inicioSemana,
          fimSemana,
          geradoPorIA: true,
        },
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

      return plano;
    });

    return { success: true, semana };
  }
);
