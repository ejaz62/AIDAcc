import Image from "next/image";
import {
  ArrowRight,
  Award,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  Code2,
  Laptop,
  MessageCircle,
  Rocket,
  Wallet,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/primitives";
import { claudeCourses, disciplines, principles, solutions, tracks } from "@/content/home";

const DISCIPLINE_ICONS = [Bot, Code2, Rocket, MessageCircle, BriefcaseBusiness];
const card = "rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-cyan-400/40";

function Band({ id, children, tinted = false }: { id?: string; children: React.ReactNode; tinted?: boolean }) {
  return (
    <section id={id} className={tinted ? "border-y border-border bg-ink-50/60 py-20 sm:py-24" : "py-20 sm:py-24"}>
      <Container>{children}</Container>
    </section>
  );
}

export function Disciplines() {
  return (
    <Band tinted>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Curriculum matrix" title="Featured learning disciplines" />
        <p className="text-sm text-ink-500">Structured, practical pathways</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {disciplines.map((d, i) => {
          const Icon = DISCIPLINE_ICONS[i];
          return (
            <li key={d.title} className={card}>
              <p className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                0{i + 1} <Icon className="size-4" aria-hidden />
              </p>
              <h3 className="mt-3 text-lg font-bold text-ink-950">{d.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{d.body}</p>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}

export function Tracks() {
  return (
    <Band id="what-you-will-learn">
      <SectionHeading
        eyebrow="Core academy curriculum"
        title="What you will learn"
        lead="Practical, build-first skills. Rather than abstract theory or generic chatbots, you learn to build, launch and maintain AI systems that solve real problems for businesses."
      />
      <ul className="mt-12 grid gap-6 lg:grid-cols-2">
        {tracks.map((t, i) => (
          <li key={t.title} className={`${card} flex flex-col p-7 sm:p-8`}>
            <p className="text-xs font-bold tracking-widest text-cyan-300 uppercase">Track #0{i + 1}</p>
            <h3 className="mt-2 text-2xl font-bold text-ink-950">{t.title}</h3>
            <p className="mt-2 font-medium text-cyan-200/90">{t.tagline}</p>
            <p className="mt-6 text-xs font-bold tracking-widest text-ink-500 uppercase">Core practical competencies</p>
            <ul className="mt-3 space-y-2.5">
              {t.competencies.map((c) => (
                <li key={c} className="flex gap-2.5 text-ink-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cyan-400" aria-hidden /> {c}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl bg-ink-100 p-4 text-sm text-ink-700 ring-1 ring-border">
              <span className="font-bold tracking-wide text-ink-950 uppercase">Business application: </span>
              {t.application}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex justify-center">
        <ButtonLink href="/curriculum" variant="secondary">
          Full curriculum <ArrowRight className="size-4" aria-hidden />
        </ButtonLink>
      </div>
    </Band>
  );
}

const FACTS = [
  { icon: CalendarDays, label: "Duration", value: "10 days · monthly batches (1st–10th, 11th–20th, 21st–30th)" },
  { icon: Clock, label: "Class time", value: "9:00–10:00 PM Pakistan time, live online" },
  { icon: Wallet, label: "Course fee", value: "PKR 15,000 · SAR 200 · USD 55" },
  { icon: Laptop, label: "You need", value: "A laptop. No coding experience required." },
  { icon: Award, label: "Certificate", value: "AIDA certificate on successful completion" },
  { icon: CheckCircle2, label: "Refund", value: "100% refund if not satisfied after the first day's class" },
];

export function ProgrammeFacts() {
  return (
    <Band tinted id="programme">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Flagship programme"
            title="AIDA AI Training Programme"
            lead="A 10-day, live, instructor-led online course for complete beginners. Learn Claude and AI tools, build websites with AI, create AI agents and publish your work online."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/fees-admission">
              Fees &amp; admission <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/programme" variant="secondary">
              Programme details
            </ButtonLink>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {FACTS.map(({ icon: Icon, label, value }) => (
            <li key={label} className={card}>
              <Icon className="size-5 text-cyan-400" aria-hidden />
              <p className="mt-3 text-xs font-bold tracking-widest text-ink-500 uppercase">{label}</p>
              <p className="mt-1 font-semibold text-ink-900">{value}</p>
            </li>
          ))}
        </ul>
      </div>
    </Band>
  );
}

export function Solutions() {
  return (
    <Band id="business-solutions">
      <SectionHeading
        eyebrow="Real-world client utility"
        title="Practical AI solutions for businesses"
        lead="Learning is grounded in commercial use: you learn to spot business bottlenecks and build dependable AI solutions that clients value."
      />
      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        {solutions.map((s, i) => (
          <li key={s.title} className={card}>
            <p className="text-xs font-bold tracking-widest text-cyan-300 uppercase">Solution #0{i + 1}</p>
            <h3 className="mt-2 text-xl font-bold text-ink-950">{s.title}</h3>
            <p className="mt-4 text-sm text-ink-500">
              <span className="font-bold text-ink-700">Client challenge: </span>
              {s.challenge}
            </p>
            <p className="mt-2 text-sm text-ink-700">
              <span className="font-bold text-cyan-300">What you learn to build: </span>
              {s.build}
            </p>
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-ink-50 p-5 text-center text-sm leading-relaxed text-ink-600">
        <strong className="text-ink-900">Realistic, transparent skill development.</strong> AIDA provides hands-on
        training and real project workflows. We make no income guarantees or promises of employment; success in
        freelancing or consulting depends on your own practice and the quality of your work.
      </p>
    </Band>
  );
}

export function ClaudeAcademy() {
  return (
    <Band tinted id="claude-academy">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="Anthropic Claude Academy" title="Learn from a fully certified Claude practitioner" />
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5">
            <Image
              src="/images/founder-muhammad-ejaz.webp"
              alt="Muhammad Ejaz"
              width={72}
              height={72}
              className="size-18 rounded-full object-cover object-top ring-2 ring-cyan-400/50"
            />
            <div>
              <p className="text-lg font-bold text-ink-950">Muhammad Ejaz</p>
              <p className="text-sm text-ink-600">Founder, AIDA · Lahore, Pakistan</p>
              <p className="mt-1 text-sm font-bold text-cyan-300">10 of 10 Claude Academy courses completed</p>
            </div>
          </div>
          <p className="mt-6 leading-relaxed text-ink-600">
            Anthropic&apos;s Claude Academy covers prompting, agentic coding, the Model Context Protocol and human-agent
            teams. This first-hand experience shapes AIDA&apos;s curriculum and student mentoring.
          </p>
          <ButtonLink href="/founder" variant="secondary" className="mt-6">
            Founder profile <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        </div>
        <ol className="grid gap-3 sm:grid-cols-2">
          {claudeCourses.map((c, i) => (
            <li key={c.title} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-sm font-bold text-cyan-300">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-ink-950">{c.title}</p>
                <p className="mt-0.5 text-sm text-ink-500">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-8 text-xs text-ink-500">Claude Academy courses are provided by Anthropic.</p>
    </Band>
  );
}

export function Principles() {
  return (
    <Band id="why-aida">
      <SectionHeading
        eyebrow="Our teaching approach"
        title="Why learn with AIDA?"
        lead="Designed to remove intimidation and focus on practical results — grounded in tools you can actually use."
      />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {principles.map((p, i) => (
          <li key={p.title} className={card}>
            <p className="text-xs font-bold tracking-widest text-cyan-300 uppercase">Principle #0{i + 1}</p>
            <h3 className="mt-2 font-bold text-ink-950">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.body}</p>
          </li>
        ))}
      </ul>
    </Band>
  );
}
