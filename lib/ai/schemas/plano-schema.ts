import { z } from "zod";

export const blocoSchema = z.object({
  data: z.string().describe("ISO date string YYYY-MM-DD"),
  materia: z.string(),
  topico: z.string(),
  tipo: z.enum(["ESTUDO_NOVO", "REVISAO", "QUESTOES", "SIMULADO", "DESCANSO"]),
  duracaoMin: z.number().int().min(15).max(240),
  prioridade: z.number().int().min(0).max(10).default(5),
  observacao: z.string().optional(),
});

export const planoGeradoSchema = z.object({
  semana: z.number().int().min(1).max(12),
  resumo: z.string().describe("2-3 sentence summary of this week's focus"),
  blocos: z.array(blocoSchema).min(5).max(50),
});

export type PlanoGerado = z.infer<typeof planoGeradoSchema>;
export type BlocoGerado = z.infer<typeof blocoSchema>;
