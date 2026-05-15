import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type AlunoStatus = "em_dia" | "atrasado" | "risco";

interface AlunoRow {
  matriculaId: string;
  userId: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  matriculaStatus: string;
  percentExecucao: number | null;
  temPlano: boolean;
  temCheckIn: boolean;
  status: AlunoStatus;
  totalMinutosExecutados: number;
  semanaAtual: number;
}

const STATUS_CONFIG: Record<AlunoStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  em_dia: { label: "Em dia", variant: "default" },
  atrasado: { label: "Atrasado", variant: "secondary" },
  risco: { label: "Em risco", variant: "destructive" },
};

interface AlunosTableProps {
  alunos: AlunoRow[];
  turmaId: string;
}

export function AlunosTable({ alunos, turmaId }: AlunosTableProps) {
  if (alunos.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        Nenhum aluno matriculado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Aluno</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 pr-4 font-medium">Execução semana</th>
            <th className="pb-2 pr-4 font-medium">Plano</th>
            <th className="pb-2 pr-4 font-medium">Check-in</th>
            <th className="pb-2 font-medium">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {alunos.map((a) => {
            const cfg = STATUS_CONFIG[a.status];
            return (
              <tr key={a.userId} className="py-2">
                <td className="py-3 pr-4">
                  <p className="font-medium">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </td>
                <td className="py-3 pr-4">
                  {a.percentExecucao !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${Math.min(100, a.percentExecucao)}%` }}
                        />
                      </div>
                      <span>{a.percentExecucao}%</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={a.temPlano ? "outline" : "destructive"}>
                    {a.temPlano ? "Gerado" : "Sem plano"}
                  </Badge>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant={a.temCheckIn ? "outline" : "secondary"}>
                    {a.temCheckIn ? "Feito" : "Pendente"}
                  </Badge>
                </td>
                <td className="py-3">
                  <Link
                    href={`/mentor/alunos/${a.userId}?turmaId=${turmaId}`}
                    className="text-primary hover:underline"
                  >
                    Ver perfil →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
