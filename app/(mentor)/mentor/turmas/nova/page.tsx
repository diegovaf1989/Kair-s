import { db } from "@/server/db";
import { TurmaForm } from "@/features/mentor/components/turma-form";

export default async function NovaTurmaPage() {
  const carreiras = await db.carreira.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Nova Turma</h1>
      <TurmaForm carreiras={carreiras} />
    </main>
  );
}
