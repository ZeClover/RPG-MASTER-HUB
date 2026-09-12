"use client";

import { useState } from "react";
import { RefreshCw, Siren } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const NPC_NAMES = [
  "Bruno",
  "Ilda",
  "Tarek",
  "Sova",
  "Renna",
  "Doro",
  "Yuki",
  "Malric",
  "Petra",
  "Osgar",
  "Nima",
  "Vosk",
  "Calla",
  "Ferrin",
];

const NPC_EPITHETS = [
  "o Ferreiro",
  "a Contrabandista",
  "o Ex-soldado",
  "a Curandeira",
  "o Cobrador de dívidas",
  "a Cartógrafa",
  "o Taberneiro",
  "a Vidente",
  "o Batedor",
];

const COMPLICATIONS = [
  "Um NPC aparentemente inofensivo revela que sabia o tempo todo.",
  "A luz se apaga e algo se move no escuro.",
  "Chega um mensageiro com notícias urgentes de outro lugar.",
  "O que parecia fácil esconde um segundo obstáculo.",
  "Um aliado pede um favor no pior momento possível.",
  "O grupo percebe que está sendo observado há algum tempo.",
  "Um item importante não está onde deveria estar.",
  "Duas testemunhas contam versões diferentes do mesmo evento.",
  "Um barulho alto chama atenção indesejada para o grupo.",
  "Alguém reconhece um dos personagens — mas de onde?",
  "Um prazo que parecia distante fica muito mais curto.",
  "A ajuda prometida não vem, ou vem tarde demais.",
  "Um detalhe pequeno ignorado antes agora faz toda diferença.",
  "Um rival aparece perseguindo o mesmo objetivo do grupo.",
  "As regras do lugar mudam de repente, e ninguém avisou.",
];

function pickNpc() {
  const name = NPC_NAMES[Math.floor(Math.random() * NPC_NAMES.length)];
  const epithet = NPC_EPITHETS[Math.floor(Math.random() * NPC_EPITHETS.length)];
  return `${name}, ${epithet}`;
}

function pickComplication() {
  return COMPLICATIONS[Math.floor(Math.random() * COMPLICATIONS.length)];
}

interface PanicButtonProps {
  className?: string;
}

export function PanicButton({ className }: PanicButtonProps) {
  const [npc, setNpc] = useState(pickNpc);
  const [complication, setComplication] = useState(pickComplication);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={className}>
          <Siren className="size-4" /> Botão do pânico
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Nome de NPC</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setNpc(pickNpc())}
            >
              <RefreshCw className="size-3.5" />
              <span className="sr-only">Sortear de novo</span>
            </Button>
          </div>
          <p className="text-sm text-foreground">{npc}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Complicação</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => setComplication(pickComplication())}
            >
              <RefreshCw className="size-3.5" />
              <span className="sr-only">Sortear de novo</span>
            </Button>
          </div>
          <p className="text-sm text-foreground">{complication}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
