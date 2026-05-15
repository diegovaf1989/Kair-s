import { type Diagnostico, type Execucao } from "@prisma/client";

interface ReplanejarPromptInput {
  diagnostico: Diagnostico;
  execucoesSemana: Execucao[];
  semanaAnterior: number;
  semana: number;
  inicioSemana: Date;
  fimSemana: Date;
  carreira: string;
  checkInHumor?: number;
  checkInConsistencia?: number;
}

export function buildReplanejarPrompt(input: ReplanejarPromptInput): string {
  const {
    diagnostico,
    execucoesSemana,
    semanaAnterior,
    semana,
    inicioSemana,
    fimSemana,
    carreira,
    checkInHumor,
    checkInConsistencia,
  } = input;

  const respostas = diagnostico.respostas as Record<string, unknown>;
  const horasDiarias = (respostas.horasDiarias as number) ?? 3;

  const execucaoResumo = execucoesSemana.map((e) => ({
    materia: e.materia,
    topico: e.topico,
    duracaoMin: e.duracaoMin,
    acerto:
      e.questoesAcerto != null && e.questoesTotal != null && e.questoesTotal > 0
        ? `${e.questoesAcerto}/${e.questoesTotal} (${Math.round((e.questoesAcerto / e.questoesTotal) * 100)}%)`
        : null,
    dominio: e.sensacaoDominio,
  }));

  const materiasEstudadas = [...new Set(execucoesSemana.map((e) => e.materia))];
  const totalMinutos = execucoesSemana.reduce((s, e) => s + e.duracaoMin, 0);

  return `Você é um especialista em planejamento de estudos para concursos públicos brasileiros.

Gere o plano de estudos da semana ${semana} com base no desempenho real da semana ${semanaAnterior}.

## Carreira-alvo
${carreira}

## Diagnóstico inicial do aluno
${JSON.stringify(respostas, null, 2)}

## Execuções da semana ${semanaAnterior} (${execucoesSemana.length} sessões, ${totalMinutos} minutos totais)
${JSON.stringify(execucaoResumo, null, 2)}

## Matérias estudadas na semana anterior
${materiasEstudadas.join(", ") || "Nenhuma registrada"}

## Check-in semanal do aluno
- Humor: ${checkInHumor ?? "não informado"}/5
- Consistência percebida: ${checkInConsistencia ?? "não informado"}/5

## Regras de ajuste
- Se acerto em questões < 50% em uma matéria → adicione mais blocos de REVISAO e QUESTOES nessa matéria
- Se sensação de domínio < 3 → reforce com ESTUDO_NOVO e REVISAO
- Se humor/consistência ≤ 2 → reduza carga total em 20%, priorize REVISAO
- Se o aluno não estudou determinada matéria na semana anterior → verifique se deve ser incluída
- Matérias com maior peso no edital têm prioridade maior

## Parâmetros da semana ${semana}
- Período: ${inicioSemana.toLocaleDateString("pt-BR")} a ${fimSemana.toLocaleDateString("pt-BR")}
- Horas disponíveis por dia: ~${horasDiarias}h
- Crie entre 5 e 7 dias com blocos variados
- Máximo de 4 blocos por dia, duração 25-120 min cada

Responda APENAS com JSON válido seguindo exatamente o schema solicitado, sem markdown, sem explicações.`;
}
