import Link from "next/link";

import { getCurrentUser } from "@/modules/core/auth/session";
import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
      <BrandMark className="size-16" />
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">RPG Master Hub</h1>
        <p className="max-w-md text-muted-foreground">
          O sistema operacional para Mestres organizarem, prepararem e narrarem campanhas de RPG que duram
          meses ou anos.
        </p>
      </div>

      {user ? (
        <Button asChild size="lg">
          <Link href="/home">Ir para minhas campanhas</Link>
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/register">Criar conta</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
