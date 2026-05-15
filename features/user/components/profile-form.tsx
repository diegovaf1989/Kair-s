"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  whatsapp: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface User {
  nome: string;
  whatsapp: string | null;
}

export function ProfileForm({ user }: { user: User }) {
  const [success, setSuccess] = useState(false);

  const update = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: user.nome, whatsapp: user.whatsapp ?? "" },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => update.mutate(v))}
      className="space-y-4"
    >
      <div className="space-y-1">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" {...register("nome")} />
        {errors.nome && (
          <p className="text-sm text-destructive">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
        <Input
          id="whatsapp"
          {...register("whatsapp")}
          placeholder="+55 61 99999-9999"
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {success ? "Salvo!" : "Salvar perfil"}
      </Button>
    </form>
  );
}
