import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Kairós Aprovação</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Mentoria fechada em ciclos de 90 dias para concurseiros
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Entrar
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-input px-4 py-2 hover:bg-accent"
        >
          Criar conta
        </Link>
      </div>
    </main>
  );
}
