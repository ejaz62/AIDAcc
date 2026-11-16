import { Info } from "lucide-react";
import { notAnApplication } from "@/content/site";
import { cn } from "@/lib/cn";

/** Makes clear that Register Interest is distinct from a formal admission application. */
export function NotAnApplication({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <aside
      aria-label="About registering interest"
      className={cn(
        "flex gap-3 rounded-(--radius-control) border border-brand-200 bg-brand-50 text-brand-950",
        compact ? "p-4 text-sm" : "p-5",
        className,
      )}
    >
      <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
      <div>
        <p className="font-semibold">{notAnApplication.title}</p>
        <p className={cn("mt-1 leading-relaxed text-brand-900/80", compact && "text-sm")}>{notAnApplication.body}</p>
      </div>
    </aside>
  );
}
