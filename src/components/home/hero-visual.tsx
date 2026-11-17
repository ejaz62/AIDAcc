import Image from "next/image";
import { CalendarDays, Clock, Laptop } from "lucide-react";
import { ASSISTANT_AVATAR } from "@/features/assistant/assistant-widget";

/** Floating Ask AIDA preview and fact chips over the hero photo (verified programme facts only). */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm lg:ml-auto lg:mr-0">
      <div className="animate-float-slow rounded-3xl border border-white/15 bg-ink-950/70 p-5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Image src={ASSISTANT_AVATAR} alt="" width={48} height={48} unoptimized className="rounded-full ring-2 ring-accent-400/60" />
          <div>
            <p className="font-display font-bold text-white">Ask AIDA</p>
            <p className="flex items-center gap-1.5 text-xs text-ink-300">
              <span className="size-2 rounded-full bg-emerald-400" aria-hidden /> Online · English, اردو, Roman Urdu
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-brand-600 px-3 py-2 text-white">fees kitni hai?</p>
          <p className="w-fit rounded-2xl rounded-bl-md bg-white px-3 py-2 text-ink-900">
            Pakistan PKR 15,000 · Saudi Arabia SAR 200 · International USD 55
          </p>
          <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-brand-600 px-3 py-2 text-white">class kab hoti hai?</p>
          <p className="w-fit rounded-2xl rounded-bl-md bg-white px-3 py-2 text-ink-900">Raat 9:00 se 10:00 PM (Pakistan time)</p>
        </div>
      </div>

      <ul className="mt-5 flex flex-wrap justify-center gap-2.5 lg:justify-end">
        {[
          { icon: CalendarDays, text: "10-day course" },
          { icon: Clock, text: "9–10 PM PKT" },
          { icon: Laptop, text: "Live & online" },
        ].map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-2 rounded-xl border border-white/15 bg-ink-950/70 px-3 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur"
          >
            <Icon className="size-4 text-accent-300" aria-hidden /> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
