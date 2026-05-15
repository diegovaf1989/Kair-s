import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { gerarPlanoSemanal } from "@/lib/inngest/functions/gerar-plano-semanal";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [gerarPlanoSemanal],
});
