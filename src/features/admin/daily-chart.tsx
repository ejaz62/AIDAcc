"use client";

import { useState } from "react";

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

/**
 * Single-series bar chart of registrations per day.
 * One hue (no legend needed), recessive axis, hover/focus tooltip per bar,
 * and an equivalent table for screen readers.
 */
export function DailyChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, Math.round(max / 2), max];
  const current = active === null ? null : data[active];

  return (
    <figure>
      <div className="relative">
        <div className="flex h-44 gap-2">
          {/* y-axis */}
          <div className="relative w-6 shrink-0 text-right text-[0.7rem] text-ink-500" aria-hidden>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
                {t}
              </span>
            ))}
          </div>
          <div className="relative flex-1">
            {ticks.map((t) => (
              <div
                key={t}
                aria-hidden
                className="absolute inset-x-0 border-t border-ink-200/80"
                style={{ bottom: `${(t / max) * 100}%` }}
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
              {data.map((d, i) => (
                <button
                  key={d.date}
                  type="button"
                  aria-label={`${fmt(d.date)}: ${d.count} registration${d.count === 1 ? "" : "s"}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group relative flex h-full flex-1 items-end focus:outline-none"
                >
                  <span
                    className="block w-full rounded-t-[4px] bg-brand-500 transition-colors group-hover:bg-brand-700 group-focus-visible:bg-brand-700"
                    style={{ height: d.count ? `${(d.count / max) * 100}%` : "0" }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
        {current && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-ink-950 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
            style={{ left: `calc(2rem + (100% - 2rem) * ${(active + 0.5) / data.length})` }}
          >
            <span className="font-semibold">{current.count}</span> on {fmt(current.date)}
          </div>
        )}
        <div className="mt-2 flex justify-between pl-8 text-[0.7rem] text-ink-500" aria-hidden>
          <span>{fmt(data[0].date)}</span>
          <span>{fmt(data[data.length - 1].date)}</span>
        </div>
      </div>
      <figcaption className="sr-only">Registrations per day over the last {data.length} days.</figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Date</th>
            <th>Registrations</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{fmt(d.date)}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
