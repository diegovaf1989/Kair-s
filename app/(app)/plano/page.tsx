import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { db } from "@/server/db";
import { PlanoSemanaCard } from "@/features/plano/components/plano-semana-card";
import { Card, CardContent } from "@/components/ui/card";

interface PlanoPageProps {
  searchParams: Promise<{ aguardando?: string }>;
}

export default async function PlanoPage({ searchParams }: PlanoPageProps) {
  const { aguardando } = await searchParams;
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const matriculaAtiva = await db.matricula.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PAGA", "PENDENTE"] },
    },
    include: { turma: true },
    orderBy: { createdAt: "desc" },
  });

  if (!matriculaAtiva) redirect("/dashboard");

  const turma = matriculaAtiva.turma;
  const agora = new Date();
  const diffMs = agora.getTime() - turma.cicloInicio.getTime();
  const semanaAtual = Math.max(1, Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000)));

  const plano = await db.plano.findUnique({
    where: {
      userId_turmaId_semana: {
        userId: user.id,
        turmaId: turma.id,
        semana: semanaAtual,
      },
    },
    include: {
      blocos: { orderBy: [{ data: "asc" }, { prioridade: "desc" }] },
    },
  });

  return (
    <main className="container mx-auto max-w-5xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meu Plano de Estudos</h1>
      </div>

      {aguardando === "1" && !plano && (
        <Card className="mb-6">
          <CardContent className="py-6 text-center">
            <p className="font-medium">Seu plano está sendo gerado pela IA...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aguarde alguns segundos e recarregue a página.
            </p>
          </CardContent>
        </Card>
      )}

      {!plano ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum plano encontrado para a semana atual. Complete o onboarding
            para gerar seu primeiro plano.
          </CardContent>
        </Card>
      ) : (
        <Suspense fallback={<p>Carregando...</p>}>
          <PlanoSemanaCard blocos={plano.blocos} semana={semanaAtual} />
        </Suspense>
      )}
    </main>
  );
}
