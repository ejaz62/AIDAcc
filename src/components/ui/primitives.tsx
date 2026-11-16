import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

type BadgeTone = "brand" | "neutral" | "accent" | "warning" | "inverse";

const badgeTones: Record<BadgeTone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  accent: "bg-accent-100 text-accent-700 ring-accent-200",
  warning: "bg-warning-50 text-warning-700 ring-warning-200",
  inverse: "bg-white/10 text-white ring-white/20",
};

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Flags content that is temporary demonstration/placeholder material. */
export function DemoBadge({ label = "Placeholder content", className }: { label?: string; className?: string }) {
  return (
    <Badge tone="warning" className={className}>
      <span aria-hidden className="size-1.5 rounded-full bg-warning-700" />
      {label}
    </Badge>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  inverse = false,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "text-sm font-semibold tracking-wide uppercase",
            inverse ? "text-accent-300" : "text-brand-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-3 text-3xl font-bold sm:text-4xl",
          inverse ? "text-white" : "text-ink-950",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className={cn("mt-4 text-lg leading-relaxed", inverse ? "text-ink-300" : "text-muted")}>
          {lead}
        </p>
      )}
    </div>
  );
}

export function Card({
  className,
  interactive = false,
  children,
}: {
  className?: string;
  interactive?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) border border-border bg-surface p-6 shadow-(--shadow-card) sm:p-8",
        interactive &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-(--shadow-lift)",
        className,
      )}
    >
      {children}
    </div>
  );
}
