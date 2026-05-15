import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExecucaoForm } from "@/features/execucao/components/execucao-form";
import { ExecucaoLista } from "@/features/execucao/components/execucao-lista";

export default async function ExecucaoPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const hoje = new Date();
  const inicio = new Date(hoje);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setHours(23, 59, 59, 999);

  const matriculaAtiva = await db.matricula.findFirst({
    where: { userId: user.id, status: { in: ["PAGA", "PENDENTE"] } },
    include: { turma: true },
    orderBy: { createdAt: "desc" },
  });

  let blocosDoDia: { id: string; materia: string; topico: string; duracaoMin: number }[] = [];

  if (matriculaAtiva) {
    const diffMs = hoje.getTime() - matriculaAtiva.turma.cicloInicio.getTime();
    const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

    const plano = await db.plano.findUnique({
      where: {
        userId_turmaId_semana: {
          userId: user.id,
          turmaId: matriculaAtiva.turmaId,
          semana: semanaAtual,
        },
      },
      include: {
        blocos: {
          where: { data: { gte: inicio, lte: fim } },
          orderBy: { prioridade: "desc" },
        },
      },
    });

    blocosDoDia = plano?.blocos ?? [];
  }

  const execucoesHoje = await db.execucao.findMany({
    where: { userId: user.id, data: { gte: inicio, lte: fim } },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Registrar Estudo</h1>

      <div className="space-y-6">
        {blocosDoDia.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Blocos planejados para hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blocosDoDia.map((bloco) => (
                <div
                  key={bloco.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{bloco.materia}</p>
                    <p className="text-muted-foreground">{bloco.topico}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0">
                    {bloco.duracaoMin}min
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova execução</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecucaoForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecucaoLista execucoes={execucoesHoje} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
