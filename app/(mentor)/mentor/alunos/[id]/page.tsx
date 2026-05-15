import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MensagemForm } from "@/features/mentor/components/mensagem-form";

const TIPO_LABEL: Record<string, string> = {
  ESTUDO_NOVO: "Novo",
  REVISAO: "Revisão",
  QUESTOES: "Questões",
  SIMULADO: "Simulado",
  DESCANSO: "Descanso",
};

export default async function AlunoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ turmaId?: string }>;
}) {
  const { id } = await params;
  const { turmaId } = await searchParams;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      diagnosticos: { orderBy: { criadoEm: "desc" }, take: 1 },
      planos: {
        where: turmaId ? { turmaId } : {},
        include: {
          blocos: { orderBy: [{ data: "asc" }, { prioridade: "desc" }] },
        },
        orderBy: { semana: "asc" },
      },
      execucoes: { orderBy: { data: "desc" }, take: 30 },
      checkIns: { orderBy: { semana: "asc" } },
    },
  });

  if (!user) notFound();

  const diagnostico = user.diagnosticos[0];
  const respostas = diagnostico?.respostas as Record<string, unknown> | undefined;

  return (
    <main className="container mx-auto max-w-4xl py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{user.nome}</h1>
        <p className="text-muted-foreground">{user.email}</p>
        {user.whatsapp && (
          <p className="text-sm text-muted-foreground">WhatsApp: {user.whatsapp}</p>
        )}
      </div>

      {/* Diagnostico */}
      {respostas && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnóstico inicial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {Object.entries(respostas).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="font-medium text-muted-foreground capitalize">
                  {k.replace(/([A-Z])/g, " $1").toLowerCase()}:
                </span>
                <span>{Array.isArray(v) ? v.join(", ") : String(v)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Check-ins */}
      {user.checkIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Check-ins semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.checkIns.map((c) => (
                <div key={c.id} className="flex items-center gap-4 text-sm">
                  <span className="font-medium w-16">Sem. {c.semana}</span>
                  <Badge variant="outline">Humor {c.humor}/5</Badge>
                  <Badge variant="outline">Consistência {c.consistencia}/5</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execuções recentes */}
      {user.execucoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas execuções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.execucoes.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start justify-between text-sm border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{e.materia}</p>
                    {e.topico && (
                      <p className="text-xs text-muted-foreground">{e.topico}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(e.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p>{e.duracaoMin}min</p>
                    {e.questoesTotal != null && e.questoesTotal > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {e.questoesAcerto ?? 0}/{e.questoesTotal} acertos
                      </p>
                    )}
                    {e.sensacaoDominio != null && (
                      <p className="text-xs text-muted-foreground">
                        domínio {e.sensacaoDominio}/5
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planos */}
      {user.planos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Planos gerados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {user.planos.map((plano) => (
              <div key={plano.id}>
                <h3 className="mb-2 font-medium text-sm">Semana {plano.semana}</h3>
                <div className="space-y-1">
                  {plano.blocos.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <span className="text-foreground font-medium">{b.materia}</span>
                      <span>—</span>
                      <span>{b.topico}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {TIPO_LABEL[b.tipo] ?? b.tipo}
                      </Badge>
                      <span className="shrink-0">{b.duracaoMin}min</span>
                      {b.editadoPorMentor && (
                        <Badge variant="secondary" className="text-xs">editado</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enviar mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <MensagemForm destinatarioId={user.id} destinatarioNome={user.nome} />
        </CardContent>
      </Card>
    </main>
  );
}
