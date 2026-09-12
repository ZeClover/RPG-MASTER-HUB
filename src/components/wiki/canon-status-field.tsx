import type { CanonStatus } from "@/generated/prisma/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CANON_STATUS_OPTIONS } from "@/components/wiki/status-config";

export function CanonStatusField({
  name = "canonStatus",
  defaultValue = "DRAFT",
}: {
  name?: string;
  defaultValue?: CanonStatus;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>Status canônico</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={name}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CANON_STATUS_OPTIONS.map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
