import { useId } from "react";
import { cn } from "@/lib/cn";

/** AIDA mark: a stylised "A" formed from a connected node graph. */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4c5efa" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${id}-g)`} />
      <path
        d="M12 29 20 11l8 18M15.2 22h9.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="11" r="2.6" fill="#fff" />
      <circle cx="12" cy="29" r="2.6" fill="#fff" />
      <circle cx="28" cy="29" r="2.6" fill="#fff" />
    </svg>
  );
}

export function Logo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-extrabold tracking-tight",
            inverse ? "text-white" : "text-ink-950",
          )}
        >
          AIDA
        </span>
        <span
          className={cn(
            "mt-0.5 hidden text-[0.625rem] font-medium tracking-wider uppercase sm:block",
            inverse ? "text-ink-400" : "text-ink-500",
          )}
        >
          AI Digital Academy
        </span>
      </span>
    </span>
  );
}
