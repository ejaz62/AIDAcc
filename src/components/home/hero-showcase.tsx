"use client";

import Image from "next/image";
import { useState } from "react";
import { showcase } from "@/content/home";
import { cn } from "@/lib/cn";

/** Large photo card with tabs under the hero (Students Lab / Live Workshops / AI Agents). */
export function HeroShowcase() {
  const [active, setActive] = useState(0);
  const item = showcase[active];
  return (
    <div className="scale-original relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-950 shadow-2xl shadow-cyan-500/10">
      <div className="relative aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        {showcase.map((s, i) => (
          <Image
            key={s.key}
            src={s.src}
            alt={s.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1280px) 1216px, 100vw"
            className={cn("object-cover transition-opacity duration-700", i === active ? "opacity-100" : "opacity-0")}
          />
        ))}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />

        <div role="tablist" aria-label="Photos" className="absolute top-4 right-4 flex gap-1 rounded-full bg-ink-950/70 p-1 ring-1 ring-white/15 backdrop-blur">
          {showcase.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                i === active ? "bg-cyan-400 text-slate-950" : "text-ink-300 hover:text-white",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="absolute inset-x-5 bottom-5 sm:inset-x-8 sm:bottom-8">
          <p className="text-xs font-bold tracking-widest text-cyan-300 uppercase">{item.eyebrow}</p>
          <h3 className="mt-2 max-w-3xl text-xl font-bold text-white sm:text-3xl">{item.title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-ink-300 sm:text-base">{item.body}</p>
          <p className="mt-3 text-[0.7rem] text-ink-400">Illustrative image</p>
        </div>
      </div>
    </div>
  );
}
