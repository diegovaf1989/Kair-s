"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

const schema = z
  .object({
    nome: z.string().min(2, "Nome obrigatório"),
    carreiraId: z.string().min(1, "Selecione uma carreira"),
    cicloInicio: z.string().min(1, "Data de início obrigatória"),
    cicloFim: z.string().min(1, "Data de fim obrigatória"),
    precoCentavos: z.number().int().positive("Preço deve ser positivo"),
    vagas: z.number().int().positive().max(200),
  })
  .refine((d) => new Date(d.cicloFim) > new Date(d.cicloInicio), {
    message: "Data de fim deve ser após a de início",
    path: ["cicloFim"],
  });

type FormValues = z.infer<typeof schema>;

interface Carreira {
  id: string;
  nome: string;
}

export function TurmaForm({ carreiras }: { carreiras: Carreira[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const criar = trpc.mentor.criarTurma.useMutation({
    onSuccess: () => router.push("/mentor/turmas"),
    onError: (e) => setError(e.message),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(values: FormValues) {
    criar.mutate({
      ...values,
      cicloInicio: new Date(values.cicloInicio),
      cicloFim: new Date(values.cicloFim),
    });
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Nova Turma</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome da turma</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Carreira</Label>
            <Select onValueChange={(v) => setValue("carreiraId", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {carreiras.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.carreiraId && (
              <p className="text-sm text-destructive">
                {errors.carreiraId.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cicloInicio">Início do ciclo</Label>
              <Input
                id="cicloInicio"
                type="date"
                {...register("cicloInicio")}
              />
              {errors.cicloInicio && (
                <p className="text-sm text-destructive">
                  {errors.cicloInicio.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cicloFim">Fim do ciclo</Label>
              <Input id="cicloFim" type="date" {...register("cicloFim")} />
              {errors.cicloFim && (
                <p className="text-sm text-destructive">
                  {errors.cicloFim.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="precoCentavos">Preço (centavos)</Label>
              <Input
                id="precoCentavos"
                type="number"
                placeholder="199700"
                {...register("precoCentavos", { valueAsNumber: true })}
              />
              {errors.precoCentavos && (
                <p className="text-sm text-destructive">
                  {errors.precoCentavos.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="vagas">Vagas</Label>
              <Input
                id="vagas"
                type="number"
                placeholder="30"
                {...register("vagas", { valueAsNumber: true })}
              />
              {errors.vagas && (
                <p className="text-sm text-destructive">
                  {errors.vagas.message}
                </p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Criar turma"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
