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
  /** Answered alone (refund, support, benefits, founder, certificates). */
  specific?: boolean;
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
      "starts", "starting", "shuru", "class time", "class hours", "hours", "hour", "classes kab", "how long", "duration", "days",
      "kitne din", "din", "mudat", "month", "monthly", "recording", "recordings", "recorded", "record", "miss", "missed",
      "attendance", "haazri", "hazri", "pst", "pkt", "night", "raat",
      "کب", "وقت", "ٹائم", "بیچ", "دن", "مدت", "دورانیہ", "ریکارڈنگ", "حاضری", "کلاس کب", "اوقات",
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
      "experience", "background", "eligibility", "eligible", "form",
      "داخلہ", "رجسٹر", "کوڈنگ", "تجربہ", "فارم",
    ],
  },
  {
    section: "programme",
    terms: [
      "course", "courses", "program", "programs", "programme", "programmes", "training", "kitne courses", "online", "live",
      "classes", "class", "info", "information", "details", "maloomat",
      "کورس", "پروگرام", "ٹریننگ", "کلاس", "معلومات",
    ],
    weight: 0.6,
  },
  {
    section: "certificates",
    terms: ["certificate", "certificates", "certification", "sertificate", "sanad", "سرٹیفکیٹ", "سند"],
    specific: true,
  },
  {
    section: "refund",
    terms: [
      "refund", "refunds", "refundable", "money back", "moneyback", "fee back", "get my money", "money returned", "wapas", "wapis",
      "wapsi", "wapas milenge", "satisfied", "not satisfied", "dissatisfied", "guarantee",
      "ریفنڈ", "واپس", "واپسی",
    ],
    weight: 2,
    specific: true,
  },
  {
    section: "benefits",
    terms: [
      "benefit", "benefits", "advantage", "advantages", "gain", "outcome", "outcomes", "worth it", "why should", "why join",
      "fayda", "faida", "faide", "fayde", "faidah", "fawaid", "kya milega",
      "فائدہ", "فائدے", "فوائد",
    ],
    weight: 1.5,
    specific: true,
  },
  {
    section: "support",
    terms: [
      "after completion", "after completing", "after the course", "after course", "completion", "after finishing",
      "complete karne ke baad", "course ke baad", "khatam hone ke baad", "baad mein", "seniors", "senior", "previous students",
      "old students", "former students", "alumni", "consult", "consultation", "mashwara", "mashwarah", "mashura", "rehnumai",
      "rahnumai", "guidance", "assist", "assistance", "help after", "whatsapp group", "whatsapp groups", "group", "groups",
      "community", "support", "project files", "source code",
      "رہنمائی", "مشورہ", "سینئر", "سینئرز", "مکمل ہونے کے بعد", "کورس کے بعد", "گروپ", "مدد",
    ],
    weight: 1.2,
    specific: true,
  },
  {
    section: "contact",
    terms: [
      "contact", "phone", "number", "email", "mail", "whatsapp number", "call", "reception", "rabta", "raabta", "helpline",
      "رابطہ", "فون", "نمبر", "ای میل",
    ],
  },
  {
    section: "founder",
    terms: [
      "founder", "owner", "ceo", "who runs", "who started", "malik", "bani", "instructor", "instructors", "teacher", "teachers",
      "trainer", "tutor", "who teaches", "ustad", "ustaad", "kaun parhata", "kaun parhate", "kaun sikhata",
      "بانی", "مالک", "استاد", "ٹیچر", "انسٹرکٹر", "ٹرینر",
    ],
    weight: 1.5,
    specific: true,
  },
  { section: "about", terms: ["what is aida", "aida kya", "about", "academy", "who are you", "tell me about", "تعارف"], weight: 0.8 },
];

/** Sections answered on their own: a direct question about them must never get a general answer. */
const SPECIFIC = new Set(INTENTS.filter((i) => i.specific).map((i) => i.section));

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
  "kya kia hai hain hy hn hoti hota hote kab kaise kese kaisay kitni kitna kitne milega milegi milenge milta milti sakta sakte sakti chahiye chahye karna karein krna karen karne mujhe muje mujhy aap ap apko apka wapas wapis paise pese paisay kaun kon kahan kidhar nahi nhi batain bataen batayen batao bataye ka ki ke ko se mein hum koi jayega jaye lein lena dena baad hoon hun raha rahi tha thi gaya jab agar lekin aur bhi wala wali".split(
    " ",
  ),
);

/** Common English words; used to recognise English when no Urdu signal is present. */
const ENGLISH_MARKERS = new Set(
  "what how is are can could would should do does did the a an you your i my me will when where who which why please tell get need about any there have has of for and to with after course this that it am".split(
    " ",
  ),
);

/** The language a single message is written in, or null when it gives no clear signal (e.g. "ok", "laptop?"). */
export function detectLanguageStrict(message: string): ReplyLanguage | null {
  if (/[؀-ۿ]/.test(message)) return "urdu";
  const words = normalise(message).split(" ").filter(Boolean);
  if (words.some((w) => ROMAN_URDU_MARKERS.has(w))) return "roman";
  if (words.some((w) => ENGLISH_MARKERS.has(w))) return "en";
  return null;
}

/** The language a single message is written in (English when unclear). */
export function detectLanguage(message: string): ReplyLanguage {
  return detectLanguageStrict(message) ?? "en";
}

/** An explicit request such as "reply in Urdu", "Roman Urdu mein batain" or "انگریزی میں". */
export function requestedLanguage(message: string): ReplyLanguage | null {
  const t = normalise(message);
  if (/\broman\s*urdu\b/.test(t)) return "roman";
  if (/\b(in|mein|me|main)\s+urdu\b|\burdu\s+(mein|me|main|script|please)\b|اردو میں|اردو زبان/.test(t)) return "urdu";
  if (/\b(in|mein|me|main)\s+english\b|\benglish\s+(mein|me|main|please)\b|انگریزی میں|انگلش میں/.test(t)) return "en";
  return null;
}

/**
 * Chooses the reply language for a conversation: an explicit request wins; otherwise
 * the language of the current message; otherwise the language used earlier in the chat.
 */
export function conversationLanguage(message: string, previousUserMessages: string[] = []): ReplyLanguage {
  const explicitNow = requestedLanguage(message);
  if (explicitNow) return explicitNow;
  const now = detectLanguageStrict(message);
  if (now) return now;
  for (const prev of [...previousUserMessages].reverse()) {
    const lang = requestedLanguage(prev) ?? detectLanguageStrict(prev);
    if (lang) return lang;
  }
  return "en";
}

const LABELS: Record<ReplyLanguage, { more: string; and: string; unavailable: string; switched: string }> = {
  en: {
    more: "More details:",
    and: " and ",
    unavailable: "I couldn't find that in AIDA's published information. Please contact AIDA Reception for help.",
    switched: "Sure — I'll reply in English. How can I help you?",
  },
  roman: {
    more: "Mazeed maloomat:",
    and: " aur ",
    unavailable: "Maazrat, yeh maloomat AIDA ki shaya shuda maloomat mein nahi mili. Madad ke liye AIDA Reception se rabta karein.",
    switched: "Zaroor — main Roman Urdu mein jawab doongi. Main aap ki kya madad kar sakti hoon?",
  },
  urdu: {
    more: "مزید معلومات:",
    and: " اور ",
    unavailable: "معذرت، یہ معلومات AIDA کی شائع شدہ معلومات میں نہیں ملی۔ مدد کے لیے AIDA ریسپشن سے رابطہ کریں۔",
    switched: "ضرور — میں اردو میں جواب دوں گی۔ میں آپ کی کیا مدد کر سکتی ہوں؟",
  },
};

/** A section's short answer in the visitor's language (English when no translation exists). */
function summaryIn(s: KnowledgeSnippet, lang: ReplyLanguage): string {
  if (lang === "roman" && s.summaryRoman) return s.summaryRoman;
  if (lang === "urdu" && s.summaryUrdu) return s.summaryUrdu;
  return s.summary;
}

/** Link to a section: its page, plus an anchor when that page shows several sections. */
function linkFor(s: KnowledgeSnippet, sections: KnowledgeSnippet[]): string {
  if (!s.page) return "";
  const shared = sections.filter((x) => x.page === s.page).length > 1;
  return shared ? `${s.page}#${s.key}` : s.page;
}

export function unavailableReply(sections: KnowledgeSnippet[], lang: ReplyLanguage = "en"): string {
  const contact = sections.find((s) => s.key === "contact");
  const { unavailable, more } = LABELS[lang];
  return contact ? `${unavailable} ${summaryIn(contact, lang)}\n\n${more} /contact` : `${unavailable} (/contact)`;
}

export interface ReplyContext {
  /** Earlier messages from the same visitor (oldest first), used to keep the conversation's language. */
  previousUserMessages?: string[];
}

export function offlineReply(message: string, { faq, sections }: AnswerSources, context: ReplyContext = {}): string {
  if (isGreeting(message)) return WELCOME;

  const lang = conversationLanguage(message, context.previousUserMessages);
  const L = LABELS[lang];
  const byKey = new Map(sections.map((s) => [s.key, s]));
  const ranked = rankIntents(message).filter((r) => byKey.has(r.section));
  const more = (items: KnowledgeSnippet[]) => {
    const links = [...new Set(items.map((s) => linkFor(s, sections)).filter(Boolean))];
    return links.length ? `\n\n${L.more} ${links.join(L.and)}` : "";
  };

  // A message that only asks to change language gets a short acknowledgement.
  if (requestedLanguage(message) && ranked.length === 0) return L.switched;

  // 1. A direct question about refunds, support, benefits, the instructor/founder or
  //    certificates is answered on its own — never with fees or the course description.
  const specific = ranked.find((r) => SPECIFIC.has(r.section) && r.score >= 1);
  if (specific) {
    const s = byKey.get(specific.section)!;
    return `${summaryIn(s, lang)}${more([s])}`;
  }

  // 2. Two topics asked together (e.g. fee and duration) get both answers.
  const [first, second] = ranked;
  if (first && second && second.score >= 1 && second.score >= first.score * 0.6 && second.section !== first.section) {
    const a = byKey.get(first.section)!;
    const b = byKey.get(second.section)!;
    return `${summaryIn(a, lang)}\n\n${summaryIn(b, lang)}${more([a, b])}`;
  }

  // 3. A specific FAQ answer (written in English) when it matches the whole question —
  //    except for topics whose full section answer must always be given (schedule, contact, course).
  const fullAnswerTopics = new Set(["schedule", "contact", "programme"]);
  const faqAllowed = (lang === "en" || !ranked.length) && !(first && fullAnswerTopics.has(first.section));
  const faqHit = faqAllowed ? matchFaq(message, faq, ranked.length ? 0.6 : 0) : null;
  const faqTopic = faqHit && rankIntents(`${faqHit.question} ${faqHit.answer}`).map((r) => r.section);
  if (faqHit && (!ranked[0] || ranked.some((r) => faqTopic!.includes(r.section)))) {
    const top = ranked[0] && byKey.get(ranked[0].section);
    return `${faqHit.answer}${top ? more([top]) : ""}`;
  }

  // 4. The best-matching section.
  if (first) {
    const s = byKey.get(first.section)!;
    return `${summaryIn(s, lang)}${more([s])}`;
  }

  return unavailableReply(sections, lang);
}
