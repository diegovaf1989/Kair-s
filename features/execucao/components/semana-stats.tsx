import { type Execucao, type Bloco } from "@prisma/client";

interface SemanaStatsProps {
  execucoes: Execucao[];
  blocos: Bloco[];
}

export function SemanaStats({ execucoes, blocos }: SemanaStatsProps) {
  const totalPlanejadoMin = blocos.reduce((s, b) => s + b.duracaoMin, 0);
  const totalExecutadoMin = execucoes.reduce((s, e) => s + e.duracaoMin, 0);
  const percentExecucao =
    totalPlanejadoMin > 0
      ? Math.min(100, Math.round((totalExecutadoMin / totalPlanejadoMin) * 100))
      : 0;

  const materiaContagem: Record<string, number> = {};
  for (const e of execucoes) {
    materiaContagem[e.materia] = (materiaContagem[e.materia] ?? 0) + e.duracaoMin;
  }
  const materiaMaisEstudada = Object.entries(materiaContagem).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0];

  const materiasNoPlano = new Set(blocos.map((b) => b.materia));
  const materiasExecutadas = new Set(execucoes.map((e) => e.materia));
  const gaps = [...materiasNoPlano].filter((m) => !materiasExecutadas.has(m));

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Execução da semana</p>
        <p className="mt-1 text-2xl font-bold">{percentExecucao}%</p>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percentExecucao}%` }}
          />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Mais estudada</p>
        <p className="mt-1 text-lg font-semibold truncate">
          {materiaMaisEstudada ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {totalExecutadoMin}min totais
        </p>
      </div>

      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Gaps detectados</p>
        {gaps.length === 0 ? (
          <p className="mt-1 text-sm font-medium text-green-600">Tudo em dia ✓</p>
        ) : (
          <ul className="mt-1 space-y-0.5">
            {gaps.slice(0, 3).map((g) => (
              <li key={g} className="text-xs text-destructive truncate">
                • {g}
              </li>
            ))}
            {gaps.length > 3 && (
              <li className="text-xs text-muted-foreground">
                +{gaps.length - 3} mais
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
