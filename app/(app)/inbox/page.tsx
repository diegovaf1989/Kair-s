import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InboxPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const mensagens = await db.mensagem.findMany({
    where: { destinatarioId: user.id },
    include: { remetente: { select: { nome: true } } },
    orderBy: { criadoEm: "desc" },
    take: 30,
  });

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Mensagens do Mentor</h1>

      {mensagens.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma mensagem recebida ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mensagens.map((m) => (
            <Card key={m.id} className={m.lida ? "opacity-70" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {m.remetente.nome}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {!m.lida && <Badge>Nova</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.criadoEm).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{m.conteudo}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
