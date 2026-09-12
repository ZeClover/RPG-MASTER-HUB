import { CloudOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <CloudOff className="size-10 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Você está offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Não foi possível carregar esta página sem conexão. Assim que a internet voltar, tente novamente.
      </p>
    </main>
  );
}
