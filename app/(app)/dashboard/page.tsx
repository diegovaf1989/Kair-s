import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SemanaStats } from "@/features/execucao/components/semana-stats";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const matriculaAtiva = await db.matricula.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PAGA", "PENDENTE"] },
      turma: { status: { in: ["ABERTA", "EM_ANDAMENTO"] } },
    },
    include: { turma: { include: { carreira: true } } },
  });

  if (!matriculaAtiva) {
    return (
      <main className="container mx-auto max-w-4xl py-10">
        <h1 className="mb-6 text-2xl font-bold">
          Olá, {user.nome.split(" ")[0]}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma turma ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você ainda não está matriculado em nenhuma turma ativa.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const agora = new Date();
  const diffMs = agora.getTime() - matriculaAtiva.turma.cicloInicio.getTime();
  const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

  const inicioSemana = new Date(matriculaAtiva.turma.cicloInicio);
  inicioSemana.setDate(inicioSemana.getDate() + (semanaAtual - 1) * 7);
  inicioSemana.setHours(0, 0, 0, 0);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  const [plano, execucoes] = await Promise.all([
    db.plano.findUnique({
      where: {
        userId_turmaId_semana: {
          userId: user.id,
          turmaId: matriculaAtiva.turmaId,
          semana: semanaAtual,
        },
      },
      include: { blocos: true },
    }),
    db.execucao.findMany({
      where: {
        userId: user.id,
        data: { gte: inicioSemana, lte: fimSemana },
      },
    }),
  ]);

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Olá, {user.nome.split(" ")[0]}
        </h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/plano">Ver plano</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/execucao">Registrar estudo</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Sua semana até aqui — Semana {semanaAtual}
          </h2>
          <SemanaStats
            execucoes={execucoes}
            blocos={plano?.blocos ?? []}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{matriculaAtiva.turma.nome}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{matriculaAtiva.turma.carreira.nome}</p>
            <p>
              {new Date(matriculaAtiva.turma.cicloInicio).toLocaleDateString("pt-BR")} →{" "}
              {new Date(matriculaAtiva.turma.cicloFim).toLocaleDateString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
