import { type Bloco, BlocoTipo } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TIPO_LABEL: Record<BlocoTipo, string> = {
  ESTUDO_NOVO: "Estudo Novo",
  REVISAO: "Revisão",
  QUESTOES: "Questões",
  SIMULADO: "Simulado",
  DESCANSO: "Descanso",
};

const TIPO_VARIANT: Record<BlocoTipo, "default" | "secondary" | "outline" | "destructive"> = {
  ESTUDO_NOVO: "default",
  REVISAO: "secondary",
  QUESTOES: "default",
  SIMULADO: "destructive",
  DESCANSO: "outline",
};

function BlocoItem({ bloco }: { bloco: Bloco }) {
  return (
    <div className="flex items-start gap-3 rounded-md border p-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{bloco.materia}</p>
        <p className="text-xs text-muted-foreground truncate">{bloco.topico}</p>
        {bloco.observacao && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {bloco.observacao}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge variant={TIPO_VARIANT[bloco.tipo]} className="text-xs">
          {TIPO_LABEL[bloco.tipo]}
        </Badge>
        <span className="text-xs text-muted-foreground">{bloco.duracaoMin}min</span>
      </div>
    </div>
  );
}

interface PlanoSemanaCardProps {
  blocos: Bloco[];
  semana: number;
}

export function PlanoSemanaCard({ blocos, semana }: PlanoSemanaCardProps) {
  const blocosPorDia = blocos.reduce<Record<string, Bloco[]>>((acc, bloco) => {
    const dia = new Date(bloco.data).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(bloco);
    return acc;
  }, {});

  const dias = Object.keys(blocosPorDia);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Semana {semana}</h2>
      {dias.length === 0 ? (
        <p className="text-muted-foreground">Nenhum bloco nesta semana.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dias.map((dia) => (
            <Card key={dia}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{dia}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {blocosPorDia[dia]!.map((bloco) => (
                  <BlocoItem key={bloco.id} bloco={bloco} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
