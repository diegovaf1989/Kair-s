"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

interface RegerarButtonProps {
  turmaId: string;
  semana: number;
  onSuccess: () => void;
}

export function RegerarButton({ turmaId, semana, onSuccess }: RegerarButtonProps) {
  const [error, setError] = useState<string | null>(null);

  const regenerar = trpc.plano.regenerar.useMutation({
    onSuccess: () => {
      setError(null);
      onSuccess();
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        disabled={regenerar.isPending}
        onClick={() => regenerar.mutate({ turmaId, semana })}
      >
        {regenerar.isPending ? "Enviando..." : "Regenerar plano"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
