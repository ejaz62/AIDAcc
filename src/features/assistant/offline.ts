import type { PublicFaq } from "@/features/faq/faq";

/*
 * Offline answers: used when no AI provider is configured or it is unavailable.
 * Matches the visitor's question against published FAQ entries; otherwise gives
 * honest, helpful guidance. Never invents information.
 */

const STOP_WORDS = new Set(
  "a an and are as at be by can do does for from how i in is it me my of on or the this to what when where which who why will with you your aida".split(
    " ",
  ),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map((w) => w.replace(/(ing|es|s)$/, ""));
}

/** Returns the best-matching FAQ entry, or null when nothing is a confident match. */
export function matchFaq(question: string, faq: PublicFaq[]): PublicFaq | null {
  const q = new Set(tokens(question));
  if (q.size === 0) return null;
  let best: { entry: PublicFaq; score: number } | null = null;
  for (const entry of faq) {
    const qTokens = new Set(tokens(entry.question));
    const aTokens = new Set(tokens(entry.answer));
    let score = 0;
    for (const t of q) {
      if (qTokens.has(t)) score += 2;
      else if (aTokens.has(t)) score += 0.5;
    }
    const normalised = score / Math.max(2, q.size);
    if (!best || normalised > best.score) best = { entry, score: normalised };
  }
  return best && best.score >= 0.75 ? best.entry : null;
}

const TOPICS: Array<{ test: RegExp; reply: string }> = [
  {
    test: /\b(fee|fees|cost|price|tuition|pay|scholarship|funding)\b/i,
    reply:
      "Fee information has not been published yet. When it is confirmed it will appear on each programme's page under /programmes. You can register interest at /register-interest to be told when details are available.",
  },
  {
    test: /\b(apply|application|admission|admissions|enrol|enroll|enrolment|enrollment|deadline)\b/i,
    reply:
      "Admissions information has not been published yet. Registering interest at /register-interest lets AIDA contact you with news. Please note that registering interest is not an application for admission.",
  },
  {
    test: /\b(course|courses|programme|programmes|program|programs|study|learn|class)\b/i,
    reply:
      "You can see every published programme at /programmes. If a programme you are looking for is not listed yet, register interest at /register-interest and AIDA will contact you when details are available.",
  },
  {
    test: /\b(contact|email|phone|call|address|reach|speak)\b/i,
    reply:
      "The Contact page (/contact) shows AIDA's official contact details once they are published. In the meantime, you can send a question with the form at /register-interest.",
  },
];

export const OFFLINE_DEFAULT_REPLY =
  "I'm not able to answer that from AIDA's published information yet. You can browse /programmes and /faq, or register interest at /register-interest and AIDA will contact you by email.";

export function offlineReply(question: string, faq: PublicFaq[]): string {
  const hit = matchFaq(question, faq);
  if (hit) return hit.answer;
  const topic = TOPICS.find((t) => t.test.test(question));
  return topic ? topic.reply : OFFLINE_DEFAULT_REPLY;
}
