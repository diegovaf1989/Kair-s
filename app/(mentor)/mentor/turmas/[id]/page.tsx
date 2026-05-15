import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TurmaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const turma = await db.turma.findUnique({
    where: { id },
    include: {
      carreira: true,
      matriculas: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!turma) notFound();

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{turma.nome}</h1>
        <p className="text-muted-foreground">{turma.carreira.nome}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Alunos ({turma.matriculas.length} / {turma.vagas})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {turma.matriculas.length === 0 ? (
            <p className="text-muted-foreground">Nenhum aluno matriculado.</p>
          ) : (
            <ul className="divide-y">
              {turma.matriculas.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="font-medium">{m.user.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.user.email}
                    </p>
                  </div>
                  <Badge variant={m.status === "PAGA" ? "default" : "outline"}>
                    {m.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
