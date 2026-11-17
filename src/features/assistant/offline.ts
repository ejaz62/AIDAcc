import type { PublicFaq } from "@/features/faq/faq";

/*
 * FAQ-mode answer engine (no AI provider needed).
 *
 * 1. Greetings (English, Urdu, Roman Urdu) → the fixed AIDA welcome.
 * 2. Topic intents matched by meaning: synonyms, spelling variants, Roman Urdu
 *    and Urdu keywords → the knowledge-base section's short answer + page link.
 * 3. Published FAQ entries matched by word overlap.
 * 4. Otherwise an honest "not available" answer pointing to AIDA Reception.
 *
 * All answer text comes from the knowledge base / FAQ in the database, so staff
 * updates are reflected immediately. This is not a conversational AI model.
 */

export const WELCOME = "Aslamoalikum! Welcome to AIDA. How can I help you today?";

export interface KnowledgeSnippet {
  key: string;
  title: string;
  summary: string;
  /** Short answer in Roman Urdu / Urdu; English is used when empty. */
  summaryRoman?: string | null;
  summaryUrdu?: string | null;
  page: string;
}

export interface AnswerSources {
  faq: PublicFaq[];
  sections: KnowledgeSnippet[];
}

/** Lower-cases, strips punctuation (keeping Urdu letters) and collapses spaces. */
export function normalise(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // Arabic/Urdu diacritics
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Greetings
// ---------------------------------------------------------------------------

const GREETING_PATTERNS: RegExp[] = [
  // Assalam-o-Alaikum and its many spellings: aslamoalikum, asalam u alaikum, salamualaikum, aoa…
  /\b(a?s+a?l+a?a?m+(\s?[uo]\s?|\s)?(a?l+a?[iy]+k+[uo]?m+|alaykum)?)\b/,
  /\bsa?la+m+\b/,
  /\baoa\b/,
  /\b(hello+|hel+o|hi+|hey+|hiya|salaam)\b/,
  /\bgood\s(morning|afternoon|evening|night|day)\b/,
  /\b(adaab|adab)\b/,
  /السلام|اسلام علیکم|سلام|ہیلو|ہائے|آداب|صبح بخیر|شام بخیر/,
];

/** Words that may accompany a greeting without making it a question. */
const GREETING_FILLER = new Set(
  "aida ask there everyone sir madam ji jee dear friend team all kaise kese ho hain hai aap ap how are you doing thanks thank".split(" "),
);

export function isGreeting(message: string): boolean {
  const text = normalise(message);
  if (!text || text.length > 80) return false;
  if (!GREETING_PATTERNS.some((p) => p.test(text))) return false;
  // Remove the greeting phrase(s) and see whether a real question remains.
  let rest = text;
  for (const p of GREETING_PATTERNS) rest = rest.replace(new RegExp(p.source, "g"), " ");
  const leftover = rest.split(/\s+/).filter((w) => w && !GREETING_FILLER.has(w) && !/^(o|u|wa|w|alaikum|alaykum|alikum|علیکم|عليكم)$/.test(w));
  return leftover.length === 0;
}

// ---------------------------------------------------------------------------
// Topic intents (English, Roman Urdu, Urdu)
// ---------------------------------------------------------------------------

interface Intent {
  section: string;
  /** Matched as whole words/phrases after normalisation. */
  terms: string[];
  weight?: number;
}

const INTENTS: Intent[] = [
  {
    section: "fees",
    terms: [
      "fee", "fees", "fess", "fes", "cost", "costs", "price", "pricing", "charges", "charge", "kitni fee", "kitni fees", "kitne paise",
      "kitne pese", "paise", "paisay", "pese", "rupees", "rs", "pkr", "sar", "usd", "dollar", "dollars", "riyal", "riyals",
      "kharcha", "amount", "payment", "pay", "easypaisa", "easy paisa", "jazzcash", "account number", "bank", "transfer",
      "jama", "bhejna", "bhejni", "discount", "discounts", "concession", "riayat",
      "فیس", "قیمت", "پیسے", "روپے", "ادائیگی", "ایزی پیسہ", "رعایت",
    ],
    weight: 1.2,
  },
  {
    section: "schedule",
    terms: [
      "timing", "timings", "time", "times", "schedule", "batch", "batches", "kab", "kis waqt", "waqt", "date", "dates", "start",
      "starts", "starting", "shuru", "class time", "classes kab", "how long", "duration", "days", "kitne din", "din", "mudat",
      "month", "monthly", "recording", "recordings", "recorded", "record", "miss", "missed", "attendance", "haazri", "hazri",
      "pst", "pkt", "night", "raat",
      "کب", "وقت", "ٹائم", "بیچ", "دن", "مدت", "ریکارڈنگ", "حاضری", "کلاس کب",
    ],
  },
  {
    section: "requirements",
    terms: [
      "laptop", "laptops", "mobile", "phone only", "smartphone", "computer", "pc", "software", "chatgpt", "chat gpt", "claude pro",
      "claude", "subscription", "requirement", "requirements", "zaroori", "zaruri", "chahiye", "internet",
      "لیپ ٹاپ", "موبائل", "کمپیوٹر", "ضروری", "سافٹ ویئر",
    ],
  },
  {
    section: "curriculum",
    terms: [
      "learn", "learning", "syllabus", "curriculum", "topics", "topic", "subjects", "outline", "content", "teach", "taught",
      "sikh", "seekh", "sikhaya", "sikhayenge", "parhaya", "parhayenge", "kya sikh", "website", "websites", "agent", "agents",
      "automation", "whatsapp", "publish",
      "نصاب", "سیکھ", "پڑھایا", "ویب سائٹ",
    ],
  },
  {
    section: "admission",
    terms: [
      "admission", "admissions", "register", "registration", "join", "joining", "enroll", "enrol", "enrollment", "enrolment",
      "apply", "application", "dakhla", "dakhila", "kaise join", "seat", "coding", "programming", "beginner", "beginners",
      "experience", "background", "eligibility", "eligible",
      "داخلہ", "رجسٹر", "کوڈنگ", "تجربہ",
    ],
  },
  {
    section: "programme",
    terms: [
      "course", "courses", "program", "programs", "programme", "programmes", "training", "kitne courses", "online", "live",
      "instructor", "classes", "class",
      "کورس", "پروگرام", "ٹریننگ", "کلاس",
    ],
    weight: 0.6,
  },
  { section: "certificates", terms: ["certificate", "certificates", "certification", "sertificate", "sanad", "سرٹیفکیٹ", "سند"] },
  {
    section: "refund",
    terms: ["refund", "refunds", "money back", "wapas", "wapis", "wapsi", "satisfied", "not satisfied", "guarantee", "ریفنڈ", "واپس"],
    weight: 1.3,
  },
  {
    section: "contact",
    terms: [
      "contact", "phone", "number", "email", "mail", "whatsapp number", "call", "reception", "rabta", "raabta", "helpline",
      "رابطہ", "فون", "نمبر", "ای میل",
    ],
  },
  { section: "founder", terms: ["founder", "owner", "ceo", "who runs", "who started", "malik", "bani", "بانی", "مالک"], weight: 1.3 },
  { section: "support", terms: ["support", "help", "madad", "project files", "source code", "مدد"], weight: 0.7 },
  { section: "about", terms: ["what is aida", "aida kya", "about", "academy", "who are you", "tell me about", "تعارف"], weight: 0.8 },
];

function hasTerm(text: string, term: string): boolean {
  if (/[؀-ۿ]/.test(term)) return text.includes(term);
  return new RegExp(`(^|\\s)${term.replace(/\s+/g, "\\s+")}(\\s|$)`).test(text);
}

/** Scores each knowledge section for a message; highest first. */
export function rankIntents(message: string): Array<{ section: string; score: number }> {
  const text = normalise(message);
  const scores = new Map<string, number>();
  for (const intent of INTENTS) {
    let score = 0;
    for (const term of intent.terms) if (hasTerm(text, term)) score += term.includes(" ") ? 1.5 : 1;
    if (score > 0) scores.set(intent.section, (scores.get(intent.section) ?? 0) + score * (intent.weight ?? 1));
  }
  return [...scores.entries()].map(([section, score]) => ({ section, score })).sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// FAQ matching
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set(
  "a an and are as at be by can do does for from how i in is it me my of on or the this to what when where which who why will with you your aida kya hai hain ka ki ke ko se mein main get got any there have has give offer much many".split(
    " ",
  ),
);

export function tokens(text: string): string[] {
  return normalise(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .map((w) => w.replace(/(ing|es|s)$/, ""));
}

/**
 * Returns the best-matching FAQ entry, or null when nothing is a confident match.
 * `minCoverage` is the share of the question words that must appear in the FAQ question.
 */
export function matchFaq(question: string, faq: PublicFaq[], minCoverage = 0): PublicFaq | null {
  const q = new Set(tokens(question));
  if (q.size === 0) return null;
  let best: { entry: PublicFaq; score: number; coverage: number } | null = null;
  for (const entry of faq) {
    const qTokens = new Set(tokens(entry.question));
    const aTokens = new Set(tokens(entry.answer));
    let score = 0;
    let covered = 0;
    for (const t of q) {
      if (qTokens.has(t)) {
        score += 2;
        covered++;
      }
      else if (aTokens.has(t)) score += 0.5;
    }
    const normalised = score / Math.max(2, q.size);
    if (!best || normalised > best.score) best = { entry, score: normalised, coverage: covered / q.size };
  }
  return best && best.score >= 1 && best.coverage >= minCoverage ? best.entry : null;
}

// ---------------------------------------------------------------------------
// Answer
// ---------------------------------------------------------------------------

export type ReplyLanguage = "en" | "roman" | "urdu";

/** Words that mark a message as Roman Urdu (Urdu written in English letters). */
const ROMAN_URDU_MARKERS = new Set(
  "kya kia hai hain hy hn hoti hota hote kab kaise kese kaisay kitni kitna kitne milega milegi milenge milta milti sakta sakte sakti chahiye chahye karna karein krna karen mujhe muje mujhy aap ap apko apka wapas wapis paise pese paisay kaun kon kahan kidhar nahi nhi batain bataen batayen batao bataye ka ki ke ko se mein hum kaun koi jayega jaye lein lena dena".split(" "),
);

/** The language to answer in: Urdu script, Roman Urdu or English. */
export function detectLanguage(message: string): ReplyLanguage {
  if (/[؀-ۿ]/.test(message)) return "urdu";
  const words = normalise(message).split(" ");
  return words.some((w) => ROMAN_URDU_MARKERS.has(w)) ? "roman" : "en";
}

const LABELS: Record<ReplyLanguage, { more: string; and: string; unavailable: string }> = {
  en: {
    more: "More details:",
    and: " and ",
    unavailable: "I couldn't find that in AIDA's published information. Please contact AIDA Reception for help.",
  },
  roman: {
    more: "Mazeed maloomat:",
    and: " aur ",
    unavailable: "Maazrat, yeh maloomat AIDA ki shaya shuda maloomat mein nahi mili. Madad ke liye AIDA Reception se rabta karein.",
  },
  urdu: {
    more: "مزید معلومات:",
    and: " اور ",
    unavailable: "معذرت، یہ معلومات AIDA کی شائع شدہ معلومات میں نہیں ملی۔ مدد کے لیے AIDA ریسپشن سے رابطہ کریں۔",
  },
};

/** A section's short answer in the visitor's language (English when no translation exists). */
function summaryIn(s: KnowledgeSnippet, lang: ReplyLanguage): string {
  if (lang === "roman" && s.summaryRoman) return s.summaryRoman;
  if (lang === "urdu" && s.summaryUrdu) return s.summaryUrdu;
  return s.summary;
}

export function unavailableReply(sections: KnowledgeSnippet[], lang: ReplyLanguage = "en"): string {
  const contact = sections.find((s) => s.key === "contact");
  const { unavailable } = LABELS[lang];
  return contact ? `${unavailable} ${summaryIn(contact, lang)}` : `${unavailable} (/contact)`;
}

export function offlineReply(message: string, { faq, sections }: AnswerSources): string {
  if (isGreeting(message)) return WELCOME;

  const lang = detectLanguage(message);
  const L = LABELS[lang];
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const ranked = rankIntents(message).filter((r) => byKey.has(r.section));
  const more = (pages: string[]) => {
    const unique = [...new Set(pages.filter(Boolean))];
    return unique.length ? `

${L.more} ${unique.join(L.and)}` : "";
  };

  // A specific FAQ answer beats a general section summary when it matches the whole
  // question and is about the same topic. FAQ answers are written in English, so for
  // Urdu / Roman Urdu questions the translated section answer is preferred.
  const faqHit = lang === "en" || !ranked.length ? matchFaq(message, faq, ranked.length ? 0.6 : 0) : null;
  const faqTopic = faqHit && rankIntents(`${faqHit.question} ${faqHit.answer}`).map((r) => r.section);
  if (faqHit && (!ranked[0] || ranked.some((r) => faqTopic!.includes(r.section)))) {
    const top = ranked[0] && byKey.get(ranked[0].section);
    return `${faqHit.answer}${more([top?.page ?? ""])}`;
  }

  if (ranked.length) {
    const first = byKey.get(ranked[0].section)!;
    // Combine a second topic when the visitor clearly asked about two things (e.g. fees and timing).
    const second = ranked[1] && ranked[1].score >= 1 && ranked[1].score >= ranked[0].score * 0.6 ? byKey.get(ranked[1].section) : null;
    if (second && second.key !== first.key) {
      return `${summaryIn(first, lang)}

${summaryIn(second, lang)}${more([first.page, second.page])}`;
    }
    return `${summaryIn(first, lang)}${more([first.page])}`;
  }

  return unavailableReply(sections, lang);
}
