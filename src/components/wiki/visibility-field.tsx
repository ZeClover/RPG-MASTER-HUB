import type { Visibility } from "@/generated/prisma/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VISIBILITY_OPTIONS } from "@/components/wiki/status-config";

export function VisibilityField({
  name = "visibility",
  defaultValue = "GM_ONLY",
}: {
  name?: string;
  defaultValue?: Visibility;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>Visibilidade</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_OPTIONS.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
