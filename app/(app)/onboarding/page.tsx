import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const matriculaAtiva = await db.matricula.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PAGA", "PENDENTE"] },
    },
    include: { turma: { include: { carreira: true } } },
    orderBy: { createdAt: "desc" },
  });

  if (!matriculaAtiva) {
    redirect("/dashboard");
  }

  return (
    <main className="container mx-auto max-w-2xl py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Bem-vindo ao Kairós Aprovação</h1>
        <p className="mt-2 text-muted-foreground">
          Vamos montar seu plano personalizado para{" "}
          <strong>{matriculaAtiva.turma.carreira.nome}</strong>
        </p>
      </div>
      <OnboardingWizard turmaId={matriculaAtiva.turmaId} />
    </main>
  );
}
