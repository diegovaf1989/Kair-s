"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MensagemFormProps {
  destinatarioId: string;
  destinatarioNome: string;
  onSuccess?: () => void;
}

export function MensagemForm({ destinatarioId, destinatarioNome, onSuccess }: MensagemFormProps) {
  const [conteudo, setConteudo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const enviar = trpc.mentor.enviarMensagem.useMutation({
    onSuccess: () => {
      setConteudo("");
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      onSuccess?.();
    },
    onError: (e) => setErro(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setErro(null);
        if (!conteudo.trim()) return;
        enviar.mutate({ destinatarioId, conteudo });
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <Label>Mensagem para {destinatarioNome}</Label>
        <Textarea
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Digite sua mensagem..."
          rows={4}
          maxLength={2000}
        />
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
      {sucesso && <p className="text-sm text-green-600">Mensagem enviada!</p>}
      <Button
        type="submit"
        disabled={enviar.isPending || !conteudo.trim()}
        size="sm"
      >
        {enviar.isPending ? "Enviando..." : "Enviar mensagem"}
      </Button>
    </form>
  );
}
