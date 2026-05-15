import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ABERTA: "Aberta",
  EM_ANDAMENTO: "Em andamento",
  ENCERRADA: "Encerrada",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  RASCUNHO: "outline",
  ABERTA: "default",
  EM_ANDAMENTO: "secondary",
  ENCERRADA: "destructive",
};

export default async function MentorTurmasPage() {
  const turmas = await db.turma.findMany({
    include: { carreira: true, _count: { select: { matriculas: true } } },
    orderBy: { cicloInicio: "desc" },
  });

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Turmas</h1>
        <Button asChild>
          <Link href="/mentor/turmas/nova">Nova turma</Link>
        </Button>
      </div>

      {turmas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma turma criada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {turmas.map((turma) => (
            <Card key={turma.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">
                  <Link
                    href={`/mentor/turmas/${turma.id}`}
                    className="hover:underline"
                  >
                    {turma.nome}
                  </Link>
                </CardTitle>
                <Badge variant={statusVariant[turma.status]}>
                  {statusLabel[turma.status]}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{turma.carreira.nome}</p>
                <p>
                  {new Date(turma.cicloInicio).toLocaleDateString("pt-BR")} →{" "}
                  {new Date(turma.cicloFim).toLocaleDateString("pt-BR")}
                </p>
                <p>
                  {turma._count.matriculas} / {turma.vagas} alunos
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
