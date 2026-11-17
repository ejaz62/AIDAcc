import Image from "next/image";
import { CalendarDays, Clock, Laptop } from "lucide-react";
import { ASSISTANT_AVATAR } from "@/features/assistant/assistant-widget";

/** Hero photo with floating highlight cards (verified programme facts only). */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      {/* Glow behind the photo */}
      <div aria-hidden className="absolute -inset-6 rounded-[3rem] bg-gradient-to-tr from-brand-600/40 via-accent-500/25 to-transparent blur-3xl" />

      <div className="relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-[2rem] ring-1 ring-white/15 shadow-2xl">
        <Image
          src="/images/hero-student.webp"
          alt="A student learning AI on his laptop"
          fill
          priority
          sizes="(min-width: 1024px) 416px, 90vw"
          className="object-cover object-[50%_20%]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-brand-900/20" />
        <div className="absolute inset-x-5 bottom-5">
          <p className="text-xs font-semibold tracking-wide text-accent-300 uppercase">AIDA AI Training Programme</p>
          <p className="mt-1 text-xl font-bold text-white">Live classes · Beginners welcome</p>
        </div>
      </div>

      {/* Ask AIDA chat preview */}
      <div className="animate-float-slow absolute -top-4 -left-2 w-60 rounded-2xl border border-white/15 bg-white/95 p-3 text-ink-900 shadow-2xl sm:-left-8 lg:-left-14">
        <div className="flex items-center gap-2">
          <Image src={ASSISTANT_AVATAR} alt="" width={30} height={30} unoptimized className="rounded-full" />
          <p className="text-sm font-bold">Ask AIDA</p>
          <span className="ml-auto size-2 rounded-full bg-emerald-500" aria-hidden />
        </div>
        <p className="mt-2 ml-auto w-fit rounded-xl rounded-br-sm bg-brand-600 px-2.5 py-1.5 text-xs text-white">fees kitni hai?</p>
        <p className="mt-1.5 w-fit rounded-xl rounded-bl-sm bg-ink-100 px-2.5 py-1.5 text-xs">PKR 15,000 · SAR 200 · USD 55</p>
      </div>

      {/* Fact chips */}
      <ul className="absolute -right-2 bottom-24 space-y-2.5 sm:-right-6 lg:-right-10">
        {[
          { icon: CalendarDays, text: "10-day course" },
          { icon: Clock, text: "9–10 PM PKT" },
          { icon: Laptop, text: "Live & online" },
        ].map(({ icon: Icon, text }, i) => (
          <li
            key={text}
            className="animate-float-slow flex items-center gap-2 rounded-xl border border-white/15 bg-ink-950/80 px-3 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur"
            style={{ animationDelay: `${(i + 1) * 0.6}s` }}
          >
            <Icon className="size-4 text-accent-300" aria-hidden /> {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
