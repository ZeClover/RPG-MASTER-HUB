"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

interface ColorFieldProps {
  name: string;
  label: string;
  defaultValue?: string | null;
  fallback?: string;
}

export function ColorField({ name, label, defaultValue, fallback = "#8b5cf6" }: ColorFieldProps) {
  const [value, setValue] = useState(defaultValue || "");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor visual)`}
          value={HEX_PATTERN.test(value) ? value : fallback}
          onChange={(event) => setValue(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0"
        />
        <Input
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={fallback}
          maxLength={7}
          className="w-28"
        />
      </div>
    </div>
  );
}
