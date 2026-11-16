import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ContactCta } from "@/components/home/contact-cta";
import { PageHeader } from "@/components/layout/page-header";
import { NotAnApplication } from "@/components/shared/not-an-application";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";
import { PROGRAMME_DETAIL_FIELDS } from "@/features/content/programmes";
import { getPublishedProgramme } from "@/features/content/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedProgramme(slug);
  return p ? { title: p.title, description: p.summary ?? undefined } : { title: "Programme not found" };
}

async function ProgrammeDetail({ params }: Props) {
  const { slug } = await params;
  const p = await getPublishedProgramme(slug);
  if (!p) notFound();

  return (
    <>
      <PageHeader eyebrow="Programme" title={p.title} lead={p.summary ?? undefined} />
      <Container className="py-14 sm:py-20">
        <Link href="/programmes" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-950">
          <ArrowLeft className="size-4" aria-hidden /> All programmes
        </Link>
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-14">
          <dl className="space-y-10 lg:col-span-2">
            {PROGRAMME_DETAIL_FIELDS.map((f) => {
              const value = p[f.key];
              return (
                <div key={f.key}>
                  <dt className="text-xl font-bold text-ink-950">{f.label}</dt>
                  <dd className="mt-3 leading-relaxed whitespace-pre-line text-ink-700">
                    {value ?? <span className="text-ink-400 italic">To be confirmed.</span>}
                  </dd>
                </div>
              );
            })}
          </dl>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-(--radius-card) border border-border bg-surface p-6">
              <h2 className="text-lg font-bold text-ink-950">Interested in this programme?</h2>
              <p className="mt-2 text-sm text-muted">Register your interest and we will keep you informed.</p>
              <ButtonLink href={`/register-interest?programme=${p.slug}`} className="mt-5 w-full">
                Register interest <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
            </div>
            <NotAnApplication compact />
          </aside>
        </div>
      </Container>
    </>
  );
}

export default function ProgrammePage(props: Props) {
  return (
    <>
      <Suspense fallback={<div className="min-h-[60vh] bg-ink-950" aria-hidden />}>
        <ProgrammeDetail {...props} />
      </Suspense>
      <ContactCta />
    </>
  );
}
