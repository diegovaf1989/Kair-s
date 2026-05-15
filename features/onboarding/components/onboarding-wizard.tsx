"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const step1Schema = z.object({
  carreiraAlvo: z.string().min(1, "Informe a carreira-alvo"),
  editaisAlvo: z.string().optional(),
  tempoEstudando: z.enum(
    ["menos_6_meses", "6_a_12_meses", "mais_1_ano", "mais_2_anos"],
    { error: "Selecione uma opção" }
  ),
});

const step2Schema = z.object({
  horasDiarias: z
    .number({ error: "Informe as horas" })
    .min(1)
    .max(12),
  diasDisponiveis: z
    .array(z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]))
    .min(1, "Selecione ao menos 1 dia"),
});

const step3Schema = z.object({
  pontosFracos: z.string().optional(),
  pontosFortes: z.string().optional(),
  metaAprovacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const DIAS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
] as const;

const TEMPO_OPTIONS = [
  { value: "menos_6_meses", label: "Menos de 6 meses" },
  { value: "6_a_12_meses", label: "6 a 12 meses" },
  { value: "mais_1_ano", label: "Mais de 1 ano" },
  { value: "mais_2_anos", label: "Mais de 2 anos" },
] as const;

export function OnboardingWizard({ turmaId }: { turmaId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1 | null>(null);
  const [step2Data, setStep2Data] = useState<Step2 | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salvarDiagnostico = trpc.onboarding.salvarDiagnostico.useMutation();
  const completar = trpc.onboarding.completar.useMutation();

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { diasDisponiveis: [] },
  });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema) });

  async function onStep1(data: Step1) {
    setStep1Data(data);
    setStep(2);
  }

  async function onStep2(data: Step2) {
    setStep2Data(data);
    setStep(3);
  }

  async function onStep3(data: Step3) {
    if (!step1Data || !step2Data) return;
    setSubmitting(true);
    setError(null);

    try {
      await salvarDiagnostico.mutateAsync({
        ...step1Data,
        ...step2Data,
        pontosFracos: data.pontosFracos
          ? data.pontosFracos.split(",").map((s) => s.trim())
          : [],
        pontosFortes: data.pontosFortes
          ? data.pontosFortes.split(",").map((s) => s.trim())
          : [],
        metaAprovacao: data.metaAprovacao,
        observacoes: data.observacoes,
      });

      await completar.mutateAsync({ turmaId });
      router.push("/plano?aguardando=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar diagnóstico");
    } finally {
      setSubmitting(false);
    }
  }

  const progressPercent = (step / 3) * 100;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-2 rounded-full bg-primary transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Etapa {step} de 3
      </p>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Sua carreira e histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
              <div className="space-y-1">
                <Label>Carreira-alvo</Label>
                <Input
                  {...form1.register("carreiraAlvo")}
                  placeholder="Ex: PRF, PCDF, TJDFT"
                />
                {form1.formState.errors.carreiraAlvo && (
                  <p className="text-sm text-destructive">
                    {form1.formState.errors.carreiraAlvo.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Edital(is) em vista (opcional)</Label>
                <Input
                  {...form1.register("editaisAlvo")}
                  placeholder="Ex: PCDF 2026"
                />
              </div>

              <div className="space-y-1">
                <Label>Há quanto tempo estuda para concurso?</Label>
                <Select
                  onValueChange={(v) =>
                    form1.setValue(
                      "tempoEstudando",
                      v as Step1["tempoEstudando"]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form1.formState.errors.tempoEstudando && (
                  <p className="text-sm text-destructive">
                    {form1.formState.errors.tempoEstudando.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full">
                Próximo
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Sua rotina de estudos</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
              <div className="space-y-1">
                <Label>Horas de estudo por dia</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  {...form2.register("horasDiarias", { valueAsNumber: true })}
                  placeholder="3"
                />
                {form2.formState.errors.horasDiarias && (
                  <p className="text-sm text-destructive">
                    {form2.formState.errors.horasDiarias.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Dias disponíveis para estudar</Label>
                <div className="flex gap-2 flex-wrap">
                  {DIAS.map((dia) => {
                    const selected = (
                      form2.watch("diasDisponiveis") ?? []
                    ).includes(dia.value);
                    return (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => {
                          const current =
                            form2.getValues("diasDisponiveis") ?? [];
                          const updated = selected
                            ? current.filter((d) => d !== dia.value)
                            : [...current, dia.value];
                          form2.setValue("diasDisponiveis", updated as Step2["diasDisponiveis"], {
                            shouldValidate: true,
                          });
                        }}
                        className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input hover:bg-accent"
                        }`}
                      >
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
                {form2.formState.errors.diasDisponiveis && (
                  <p className="text-sm text-destructive">
                    {form2.formState.errors.diasDisponiveis.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1">
                  Próximo
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Pontos fortes, fracos e metas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
              <div className="space-y-1">
                <Label>Pontos fracos (separados por vírgula)</Label>
                <Input
                  {...form3.register("pontosFracos")}
                  placeholder="Ex: Direito Constitucional, Matemática"
                />
              </div>

              <div className="space-y-1">
                <Label>Pontos fortes (separados por vírgula)</Label>
                <Input
                  {...form3.register("pontosFortes")}
                  placeholder="Ex: Língua Portuguesa, Informática"
                />
              </div>

              <div className="space-y-1">
                <Label>Meta de aprovação (opcional)</Label>
                <Input
                  {...form3.register("metaAprovacao")}
                  placeholder="Ex: Top 100 da lista PRF 2026"
                />
              </div>

              <div className="space-y-1">
                <Label>Observações adicionais</Label>
                <Textarea
                  {...form3.register("observacoes")}
                  placeholder="Alguma informação relevante sobre seu momento atual de estudos?"
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Gerando plano..." : "Concluir e gerar plano"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
