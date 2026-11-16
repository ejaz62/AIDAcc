import Link from "next/link";
import { ArrowRight, CalendarClock, Clock, ListChecks, MonitorPlay } from "lucide-react";
import { programmes } from "@/content/site";
import { Badge, Container, SectionHeading } from "@/components/ui/primitives";
import { getPublishedProgrammes } from "@/features/content/queries";

/**
 * Programme catalogue. Shows programmes published by AIDA staff; until there are
 * any, it explains that details are coming and shows what each listing will include.
 */
export async function Programmes() {
  const items = await getPublishedProgrammes();

  return (
    <section id="programmes" className="pt-20 sm:pt-28">
      <Container>
        {items.length > 0 ? (
          <>
            <SectionHeading
              eyebrow={programmes.eyebrow}
              title="Our programmes"
              lead="Select a programme to see its full details."
            />
            <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/programmes/${p.slug}`}
                    className="group flex h-full flex-col rounded-(--radius-card) border border-border bg-surface p-6 shadow-(--shadow-card) transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-(--shadow-lift) sm:p-8"
                  >
                    <h3 className="text-xl font-bold text-ink-950 group-hover:text-brand-700">{p.title}</h3>
                    {p.summary && <p className="mt-3 flex-1 leading-relaxed text-muted">{p.summary}</p>}
                    <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-600">
                      {p.duration && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-4 text-brand-500" aria-hidden /> {p.duration}
                        </span>
                      )}
                      {p.studyFormat && (
                        <span className="flex items-center gap-1.5">
                          <MonitorPlay className="size-4 text-brand-500" aria-hidden /> {p.studyFormat}
                        </span>
                      )}
                    </div>
                    <span className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                      View programme <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <SectionHeading eyebrow={programmes.eyebrow} title={programmes.title} lead={programmes.lead} />
            <div className="mt-14 grid gap-6 lg:grid-cols-5">
              <div className="flex flex-col justify-between rounded-(--radius-card) bg-gradient-to-br from-brand-700 to-brand-950 p-8 text-white shadow-(--shadow-lift) lg:col-span-2">
                <div>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                    <CalendarClock className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-2xl font-bold">Programmes coming soon</h3>
                  <p className="mt-3 leading-relaxed text-brand-100">
                    Programme details will appear here as soon as they are officially confirmed.
                  </p>
                </div>
                <Badge tone="inverse" className="mt-8 self-start">
                  No programmes published yet
                </Badge>
              </div>
              <div className="rounded-(--radius-card) border border-dashed border-ink-300 bg-surface/60 p-8 lg:col-span-3">
                <div className="flex items-center gap-3">
                  <ListChecks className="size-5 text-brand-600" aria-hidden />
                  <h3 className="text-lg font-bold text-ink-950">Each programme listing will include</h3>
                </div>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {programmes.fields.map((field) => (
                    <div
                      key={field}
                      className="flex items-center justify-between gap-4 rounded-(--radius-control) bg-ink-50 px-4 py-3 ring-1 ring-ink-200/70 ring-inset"
                    >
                      <dt className="text-sm font-semibold text-ink-800">{field}</dt>
                      <dd className="text-xs font-medium text-ink-500">To be confirmed</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
