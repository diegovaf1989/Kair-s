import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <h1 className="mb-6 text-2xl font-bold">
        Olá, {user.nome.split(" ")[0]}
      </h1>

      {!matriculaAtiva ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma turma ativa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você ainda não está matriculado em nenhuma turma ativa. Aguarde a
              abertura do próximo ciclo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{matriculaAtiva.turma.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Carreira: {matriculaAtiva.turma.carreira.nome}
            </p>
            <p className="text-muted-foreground">
              Status: {matriculaAtiva.status}
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
