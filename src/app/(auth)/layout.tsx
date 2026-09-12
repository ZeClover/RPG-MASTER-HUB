import type { ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark className="size-8" />
        <span className="text-lg font-semibold tracking-tight">RPG Master Hub</span>
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">{children}</div>
    </main>
  );
}
