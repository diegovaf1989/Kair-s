import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlunosTable } from "@/features/mentor/components/alunos-table";

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada",
};

export default async function TurmaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const turma = await db.turma.findUnique({
    where: { id },
    include: { carreira: true },
  });

  if (!turma) notFound();

  const agora = new Date();
  const diffMs = agora.getTime() - turma.cicloInicio.getTime();
  const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

  const inicioSemana = new Date(turma.cicloInicio);
  inicioSemana.setDate(inicioSemana.getDate() + (semanaAtual - 1) * 7);
  inicioSemana.setHours(0, 0, 0, 0);
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(fimSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);

  const matriculas = await db.matricula.findMany({
    where: { turmaId: id },
    include: {
      user: {
        include: {
          execucoes: { where: { data: { gte: inicioSemana, lte: fimSemana } } },
          planos: {
            where: { turmaId: id, semana: semanaAtual },
            include: { blocos: true },
          },
          checkIns: { where: { semana: semanaAtual } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const alunos = matriculas.map((m) => {
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

  const emRisco = alunos.filter((a) => a.status === "risco").length;
  const emDia = alunos.filter((a) => a.status === "em_dia").length;

  return (
    <main className="container mx-auto max-w-5xl py-10">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{turma.nome}</h1>
          <Badge variant="outline">{STATUS_LABEL[turma.status]}</Badge>
        </div>
        <p className="text-muted-foreground">{turma.carreira.nome} · Semana {semanaAtual}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{alunos.length}</p>
          <p className="text-sm text-muted-foreground">Total de alunos</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{emDia}</p>
          <p className="text-sm text-muted-foreground">Em dia</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{emRisco}</p>
          <p className="text-sm text-muted-foreground">Em risco</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <AlunosTable alunos={alunos} turmaId={id} />
        </CardContent>
      </Card>
    </main>
  );
}
