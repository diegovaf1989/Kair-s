"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  materia: z.string().min(1, "Informe a matéria"),
  topico: z.string().optional(),
  duracaoMin: z.number({ message: "Informe a duração" }).int().min(1).max(600),
  questoesTotal: z.number().int().min(0).optional(),
  questoesAcerto: z.number().int().min(0).optional(),
  sensacaoDominio: z.number().int().min(1).max(5).optional(),
  observacao: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Bloco {
  id: string;
  materia: string;
  topico: string;
  duracaoMin: number;
}

interface ExecucaoFormProps {
  blocoId?: string;
  blocoSugestao?: Bloco;
  onSuccess?: () => void;
}

export function ExecucaoForm({ blocoId, blocoSugestao, onSuccess }: ExecucaoFormProps) {
  const registrar = trpc.execucao.registrar.useMutation({ onSuccess });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      materia: blocoSugestao?.materia ?? "",
      topico: blocoSugestao?.topico ?? "",
      duracaoMin: blocoSugestao?.duracaoMin ?? 60,
    },
  });

  async function onSubmit(values: FormValues) {
    await registrar.mutateAsync({
      ...values,
      blocoId,
      data: new Date(),
    });
    reset();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Matéria *</Label>
          <Input {...register("materia")} placeholder="Ex: Direito Constitucional" />
          {errors.materia && (
            <p className="text-sm text-destructive">{errors.materia.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Tópico</Label>
          <Input {...register("topico")} placeholder="Ex: Princípios fundamentais" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Duração (min) *</Label>
          <Input
            type="number"
            min={1}
            {...register("duracaoMin", { valueAsNumber: true })}
          />
          {errors.duracaoMin && (
            <p className="text-sm text-destructive">{errors.duracaoMin.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Questões feitas</Label>
          <Input
            type="number"
            min={0}
            {...register("questoesTotal", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <Label>Questões certas</Label>
          <Input
            type="number"
            min={0}
            {...register("questoesAcerto", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Sensação de domínio</Label>
        <Select
          onValueChange={(v) =>
            setValue("sensacaoDominio", parseInt(v) as 1 | 2 | 3 | 4 | 5)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Como você se sentiu?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 — Muito perdido</SelectItem>
            <SelectItem value="2">2 — Confuso</SelectItem>
            <SelectItem value="3">3 — Razoável</SelectItem>
            <SelectItem value="4">4 — Confiante</SelectItem>
            <SelectItem value="5">5 — Dominei</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Observação</Label>
        <Textarea
          {...register("observacao")}
          placeholder="Algo importante sobre essa sessão?"
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Registrando..." : "Registrar estudo"}
      </Button>
    </form>
  );
}
