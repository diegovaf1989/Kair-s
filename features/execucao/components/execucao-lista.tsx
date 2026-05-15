import { type Execucao } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface ExecucaoListaProps {
  execucoes: Execucao[];
}

export function ExecucaoLista({ execucoes }: ExecucaoListaProps) {
  if (execucoes.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        Nenhuma execução registrada hoje.
      </p>
    );
  }

  const totalMinutos = execucoes.reduce((s, e) => s + e.duracaoMin, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {execucoes.length} sessão(ões) · {totalMinutos} minutos hoje
      </p>
      {execucoes.map((e) => (
        <div
          key={e.id}
          className="flex items-start justify-between rounded-md border p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{e.materia}</p>
            {e.topico && (
              <p className="text-xs text-muted-foreground">{e.topico}</p>
            )}
            {e.observacao && (
              <p className="text-xs text-muted-foreground italic mt-1">
                {e.observacao}
              </p>
            )}
          </div>
          <div className="ml-3 flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground">{e.duracaoMin}min</span>
            {e.questoesTotal != null && e.questoesTotal > 0 && (
              <Badge variant="outline" className="text-xs">
                {e.questoesAcerto ?? 0}/{e.questoesTotal} acertos
              </Badge>
            )}
            {e.sensacaoDominio != null && (
              <Badge variant="secondary" className="text-xs">
                domínio {e.sensacaoDominio}/5
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
