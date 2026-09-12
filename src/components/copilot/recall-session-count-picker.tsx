"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const OPTIONS = [
  { value: "1", label: "Desde a última sessão" },
  { value: "2", label: "Últimas 2 sessões" },
  { value: "3", label: "Últimas 3 sessões" },
  { value: "5", label: "Últimas 5 sessões" },
  { value: "10", label: "Últimas 10 sessões" },
];

export function RecallSessionCountPicker({ current }: { current: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sessions", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="recall-sessions">Período</Label>
      <Select value={String(current)} onValueChange={handleChange}>
        <SelectTrigger id="recall-sessions" className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
