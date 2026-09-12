import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

export function MarkdownContent({ source, className }: { source: string; className?: string }) {
  const html = renderMarkdown(source);

  return (
    <div
      className={cn(
        "prose prose-sm prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
