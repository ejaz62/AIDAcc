/*
 * Situational awareness for FAQ mode: recognises when a visitor shares a personal
 * situation (illness, a family emergency, work, travel, an achievement, frustration)
 * or says they will miss a class, and supplies a short, sincere opener and closing in
 * the visitor's language.
 *
 * Boundaries (deliberate): the wording expresses care but never makes a commitment
 * on AIDA's behalf — no attendance exemptions, extra or private classes, recording
 * availability periods, personal support promises or medical advice. The only facts
 * used are the published ones: recordings for catching up, at least 8 of 10 days'
 * attendance, and AIDA Reception's contact details.
 */
import type { ReplyLanguage } from "./offline";

export type Situation = "family" | "medical" | "travel" | "work" | "frustration" | "achievement";

/** Checked in this order: the first match wins (a family emergency outweighs travel, etc.). */
const SITUATION_TERMS: Array<[Situation, string[]]> = [
  [
    "family",
    [
      "family emergency", "emergency", "funeral", "passed away", "died", "death in", "bereavement", "loss in my family",
      "fotgi", "faut", "inteqal", "intiqal", "janaza", "gharelu masla", "ghar mein masla",
      "ایمرجنسی", "فوتگی", "انتقال", "جنازہ", "گھریلو مسئلہ",
    ],
  ],
  [
    "medical",
    [
      "treatment", "eye", "eyes", "surgery", "operation", "hospital", "doctor", "sick", "ill", "illness", "unwell",
      "not feeling well", "fever", "flu", "injury", "injured", "medical", "medicine", "health", "checkup",
      "bimar", "beemar", "ilaaj", "ilaj", "aankh", "ankh", "bukhar", "tabiyat", "tabeeat", "sehat", "dawai",
      "بیمار", "علاج", "ہسپتال", "ڈاکٹر", "آنکھ", "بخار", "طبیعت", "آپریشن", "صحت", "دوائی",
    ],
  ],
  [
    "travel",
    [
      "travel", "travelling", "traveling", "trip", "journey", "flight", "flying", "abroad", "out of town", "out of city",
      "vacation", "holiday", "safar", "sair",
      "سفر", "پرواز", "شہر سے باہر",
    ],
  ],
  [
    "work",
    [
      "work", "office", "job", "shift", "duty", "meeting", "overtime", "my boss", "deadline",
      "kaam", "naukri", "dafter", "daftar",
      "دفتر", "کام", "ڈیوٹی", "نوکری", "ملازمت",
    ],
  ],
  [
    "frustration",
    [
      "frustrated", "frustrating", "angry", "upset", "annoyed", "disappointed", "not working", "doesnt work", "does not work",
      "confused", "worried", "stressed", "fed up", "pareshan", "naraz", "ghussa", "tang aa", "samajh nahi",
      "پریشان", "ناراض", "غصہ", "تنگ",
    ],
  ],
  [
    "achievement",
    [
      "i passed", "got a job", "got hired", "first client", "launched my", "published my", "built my", "my website is live",
      "promotion", "i won", "achieved", "kamyab", "kamyabi", "job mil gayi", "pass ho gaya", "pass ho gayi", "client mil gaya",
      "کامیاب", "کامیابی", "نوکری مل", "پاس ہو",
    ],
  ],
];

/** Words that mean the visitor will miss (or missed) a class. */
const ABSENCE_TERMS = [
  "miss", "missing", "missed", "unable to attend", "cant attend", "can t attend", "cannot attend", "wont attend",
  "won t attend", "not attend", "not be able to attend", "wont be able", "won t be able", "absent", "absence", "skip",
  "leave", "chutti", "nahi aa", "nahi aa sakta", "nahi aa sakti", "nahi aa sakoonga", "attend nahi", "class nahi le",
  "شامل نہیں", "نہیں آ سکتا", "نہیں آ سکتی", "نہیں آ سکوں", "غیر حاضر", "چھٹی", "کلاس میں نہیں",
];

function normaliseForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text: string, term: string): boolean {
  if (/[؀-ۿ]/.test(term)) return text.includes(term);
  return new RegExp(`(^|\\s)${term.replace(/'/g, "").replace(/\s+/g, "\\s+")}(\\s|$)`).test(text);
}

export function detectSituation(message: string): Situation | null {
  const text = normaliseForMatch(message);
  for (const [situation, terms] of SITUATION_TERMS) if (terms.some((t) => has(text, t))) return situation;
  return null;
}

export function mentionsAbsence(message: string): boolean {
  const text = normaliseForMatch(message);
  return ABSENCE_TERMS.some((t) => has(text, t));
}

type Lines = Record<ReplyLanguage, string>;

const OPENERS: Record<Situation, Lines> = {
  medical: {
    en: "I'm sorry to hear that, and I hope your treatment goes smoothly. Please take good care of your health first.",
    roman: "Yeh sun kar afsos hua — umeed hai aap ka ilaaj achhe se ho jaye. Pehle apni sehat ka khayal rakhein.",
    urdu: "یہ سن کر افسوس ہوا — امید ہے آپ کا علاج اچھی طرح ہو جائے۔ پہلے اپنی صحت کا خیال رکھیں۔",
  },
  family: {
    en: "I'm very sorry to hear about this. Please take care of yourself and your family first.",
    roman: "Yeh sun kar bohat afsos hua. Pehle apna aur apne ghar walon ka khayal rakhein.",
    urdu: "یہ سن کر بہت افسوس ہوا۔ پہلے اپنا اور اپنے گھر والوں کا خیال رکھیں۔",
  },
  travel: {
    en: "Thanks for letting us know — I hope you have a safe journey!",
    roman: "Batane ka shukriya — umeed hai aap ka safar mehfooz aur khush-gawar rahe!",
    urdu: "بتانے کا شکریہ — امید ہے آپ کا سفر محفوظ اور خوشگوار رہے!",
  },
  work: {
    en: "That's completely understandable — work commitments do come up.",
    roman: "Bilkul samajh sakte hain — kaam ki masroofiyat ho jati hai.",
    urdu: "بالکل سمجھ سکتے ہیں — کام کی مصروفیت ہو جاتی ہے۔",
  },
  frustration: {
    en: "I'm sorry this has been frustrating — I'd like to help.",
    roman: "Maazrat ke aap ko pareshani hui — main madad karna chahti hoon.",
    urdu: "معذرت کہ آپ کو پریشانی ہوئی — میں مدد کرنا چاہتی ہوں۔",
  },
  achievement: {
    en: "Congratulations — that's a wonderful achievement! Keep practising and building; every project makes you stronger.",
    roman: "Bohat bohat mubarak ho — yeh zabardast kamyabi hai! Practice aur naye projects jaari rakhein.",
    urdu: "بہت بہت مبارک ہو — یہ زبردست کامیابی ہے! مشق اور نئے پراجیکٹس جاری رکھیں۔",
  },
};

const CLOSINGS: Partial<Record<Situation, Lines>> = {
  medical: { en: "Wishing you a speedy recovery!", roman: "Aap jald sehatyab hon!", urdu: "آپ جلد صحت یاب ہوں!" },
  family: { en: "Our thoughts are with you.", roman: "Hamari duaen aap ke saath hain.", urdu: "ہماری دعائیں آپ کے ساتھ ہیں۔" },
  travel: { en: "Safe travels!", roman: "Safar bakhair!", urdu: "سفر بخیر!" },
  work: { en: "All the best with your work!", roman: "Kaam mein kamyabi ho!", urdu: "کام میں کامیابی ہو!" },
};

const ABSENCE_OPENER: Lines = {
  en: "Thanks for letting us know.",
  roman: "Batane ka shukriya.",
  urdu: "بتانے کا شکریہ۔",
};

/** The published facts about missing a class — nothing more is promised. */
const ABSENCE_FACTS: Lines = {
  en: "You can use the class recording to catch up on the missed lesson. Please keep in mind that students are expected to attend at least 8 of the 10 days; if you are worried about attendance, AIDA Reception (+92 322 720 4898) can advise you.",
  roman: "Reh jane wala sabaq aap class ki recording se cover kar sakte hain. Yaad rahe ke 10 mein se kam az kam 8 din attendance zaroori hai; attendance ke baare mein fikr ho to AIDA Reception (+92 322 720 4898) se rabta karein.",
  urdu: "رہ جانے والا سبق آپ کلاس کی ریکارڈنگ سے پورا کر سکتے ہیں۔ یاد رہے کہ 10 میں سے کم از کم 8 دن حاضری ضروری ہے؛ حاضری کے بارے میں فکر ہو تو AIDA ریسپشن (+92 322 720 4898) سے رابطہ کریں۔",
};

const HOW_CAN_I_HELP: Lines = {
  en: "Could you tell me a little more about what you need? You can also reach AIDA Reception on +92 322 720 4898 or mentorsvalley@gmail.com.",
  roman: "Thora sa bata dein ke aap ko kis cheez mein madad chahiye? Aap AIDA Reception se +92 322 720 4898 ya mentorsvalley@gmail.com par bhi rabta kar sakte hain.",
  urdu: "تھوڑا سا بتا دیں کہ آپ کو کس چیز میں مدد چاہیے؟ آپ AIDA ریسپشن سے +92 322 720 4898 یا mentorsvalley@gmail.com پر بھی رابطہ کر سکتے ہیں۔",
};

export interface SituationalParts {
  /** The situation recognised, or "absence" when the visitor only mentions missing a class. */
  kind: Situation | "absence";
  opener: string;
  /** Facts to add for a missed class, if the visitor mentioned one. */
  absenceFacts?: string;
  closing?: string;
  /** Used when nothing else answers the message (e.g. frustration with no clear topic). */
  fallback: string;
}

/** Empathetic wording for a message, or null when the visitor shares no situation. */
export function situationalParts(message: string, lang: ReplyLanguage): SituationalParts | null {
  const situation = detectSituation(message);
  const absent = mentionsAbsence(message);
  if (!situation && !absent) return null;
  return {
    kind: situation ?? "absence",
    opener: situation ? OPENERS[situation][lang] : ABSENCE_OPENER[lang],
    absenceFacts: absent ? ABSENCE_FACTS[lang] : undefined,
    closing: situation ? CLOSINGS[situation]?.[lang] : undefined,
    fallback: HOW_CAN_I_HELP[lang],
  };
}
