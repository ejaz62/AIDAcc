import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClasses = (invalid?: boolean) =>
  cn(
    "block w-full rounded-(--radius-control) border bg-surface px-4 py-3 text-base text-ink-900 shadow-xs transition-colors placeholder:text-ink-400 focus:outline-none focus:ring-4",
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-ink-300 hover:border-ink-400 focus:border-brand-500 focus:ring-brand-100",
  );

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-semibold text-ink-800">
        {label}
        {optional && <span className="text-xs font-normal text-ink-500">Optional</span>}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-500">
          {hint}
        </p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Builds aria-describedby for a field from its hint and error ids. */
export const describedBy = (id: string, opts: { hint?: boolean; error?: boolean }) =>
  [opts.hint && `${id}-hint`, opts.error && `${id}-error`].filter(Boolean).join(" ") || undefined;
