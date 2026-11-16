import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "outline-inverse";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-(--radius-control) font-semibold whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-(--shadow-glow) active:bg-brand-800",
  secondary:
    "bg-surface text-ink-900 ring-1 ring-ink-200 ring-inset hover:bg-ink-100 hover:ring-ink-300",
  ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
  inverse: "bg-white text-ink-950 hover:bg-brand-50 hover:shadow-(--shadow-glow)",
  "outline-inverse":
    "text-white ring-1 ring-white/25 ring-inset hover:bg-white/10 hover:ring-white/40",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-6 text-base",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: Omit<StyleProps, "children">) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: StyleProps & Omit<ComponentProps<"button">, keyof StyleProps>) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...props
}: StyleProps & Omit<ComponentProps<typeof Link>, keyof StyleProps>) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props}>
      {children}
    </Link>
  );
}
