import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { OpenAssistantButton } from "@/features/assistant/assistant-widget";
import { getKnowledgeSections } from "@/features/content/queries";
import { buttonClasses } from "@/components/ui/button";

/** Renders staff-edited Markdown safely (react-markdown never renders raw HTML). */
export function KnowledgeMarkdown({ children }: { children: string }) {
  return (
    <div className="knowledge-prose">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = "", children }) =>
            href.startsWith("/") ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}

/** Loads the requested knowledge-base sections, in the order given. */
export async function loadSections(keys: string[]) {
  const all = await getKnowledgeSections();
  return keys.map((k) => all.find((s) => s.key === k)).filter((s): s is NonNullable<typeof s> => Boolean(s));
}

/** One card per knowledge section, each with an anchor so the assistant and menus can link to it. */
export async function KnowledgeSections({ keys, showTitles = true }: { keys: string[]; showTitles?: boolean }) {
  const sections = await loadSections(keys);
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl space-y-8">
        {sections.length === 0 && (
          <p className="rounded-(--radius-card) border border-dashed border-ink-300 p-8 text-center text-ink-600">
            This information is being updated. Please contact AIDA Reception for details.
          </p>
        )}
        {sections.map((s) => (
          <article
            key={s.key}
            id={s.key}
            className="scroll-mt-24 rounded-(--radius-card) border border-border bg-surface p-6 shadow-sm sm:p-10"
          >
            {showTitles && <h2 className="text-2xl font-bold text-ink-950 sm:text-3xl">{s.title}</h2>}
            <div className={showTitles ? "mt-5" : ""}>
              <KnowledgeMarkdown>{s.body}</KnowledgeMarkdown>
            </div>
          </article>
        ))}
      </Container>
    </section>
  );
}

/** Closing call to action used on knowledge pages: ask the assistant or contact Reception. */
export function KnowledgeHelp() {
  return (
    <section className="pb-20 sm:pb-24">
      <Container className="max-w-4xl">
        <div className="flex flex-col gap-6 rounded-(--radius-card) bg-ink-950 p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-bold">Still have a question?</h2>
            <p className="mt-2 text-ink-300">Ask our assistant in English, Urdu or Roman Urdu, or contact AIDA Reception.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <OpenAssistantButton className={buttonClasses({ variant: "inverse" })}>
              <MessageCircle className="size-4" aria-hidden /> Ask AIDA
            </OpenAssistantButton>
            <ButtonLink href="/contact" variant="outline-inverse">
              <Phone className="size-4" aria-hidden /> Contact Reception
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
