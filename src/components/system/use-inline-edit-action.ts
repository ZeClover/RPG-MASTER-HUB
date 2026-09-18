"use client";

import { useState, useTransition, type FormEvent } from "react";

export type InlineEditActionResult =
  | { errors?: Partial<Record<string, string[]>>; error?: string; message?: string }
  | undefined;

/**
 * Envia um `<form>` de edição inline (linha vira formulário, mesmo padrão de
 * `TagRow`) chamando a Server Action diretamente via `useTransition`, em vez
 * de `useActionState` — que exigiria fechar o modo edição a partir de um
 * `useEffect` reagindo ao `state` devolvido, e `setState` síncrono dentro de
 * efeito é evitado neste código-base (regra de lint `react-hooks/set-state-in-effect`).
 * Usado pelas 6 listas do Construtor de Sistema (Fase 13) para editar uma
 * linha existente; o formulário de "adicionar" no fim de cada lista continua
 * usando `useActionState` normalmente (mesmo padrão de `AddEntryForm`,
 * `RollTableEntryList`), porque ali não há nenhum estado local para fechar.
 */
export function useInlineEditAction(
  action: (formData: FormData) => Promise<InlineEditActionResult>,
  onSuccess: () => void,
) {
  const [result, setResult] = useState<InlineEditActionResult>(undefined);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await action(formData);
      if (next?.error || next?.errors) {
        setResult(next);
        return;
      }
      setResult(undefined);
      onSuccess();
    });
  }

  return { handleSubmit, result, isPending };
}
