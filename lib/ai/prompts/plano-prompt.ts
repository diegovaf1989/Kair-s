import { type Diagnostico } from "@prisma/client";

interface PlanoPromptInput {
  diagnostico: Diagnostico;
  semana: number;
  inicioSemana: Date;
  fimSemana: Date;
  carreira: string;
  horasDisponiveisPorDia?: number;
}

export function buildPlanoPrompt(input: PlanoPromptInput): string {
  const { diagnostico, semana, inicioSemana, fimSemana, carreira, horasDisponiveisPorDia = 3 } = input;
  const respostas = diagnostico.respostas as Record<string, unknown>;

  return `Você é um especialista em planejamento de estudos para concursos públicos brasileiros.

Gere um plano de estudos semanal detalhado para um concurseiro com as seguintes características:

## Carreira-alvo
${carreira}

## Diagnóstico do aluno
${JSON.stringify(respostas, null, 2)}

## Parâmetros da semana
- Semana ${semana} do ciclo
- Período: ${inicioSemana.toLocaleDateString("pt-BR")} a ${fimSemana.toLocaleDateString("pt-BR")}
- Horas disponíveis por dia: ~${horasDisponiveisPorDia}h

## Instruções
- Crie entre 5 e 7 dias de estudo com blocos variados
- Alterne entre ESTUDO_NOVO, REVISAO e QUESTOES
- Inclua pelo menos 1 bloco de DESCANSO na semana
- Priorize matérias com maior peso no edital e pontos fracos do aluno
- Use datas no formato ISO (YYYY-MM-DD) dentro do intervalo fornecido
- Duração de cada bloco: 25 a 120 minutos
- Máximo de 4 blocos por dia

Responda APENAS com JSON válido seguindo exatamente o schema solicitado, sem markdown, sem explicações.`;
}
