import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { conversationLanguage, detectLanguageStrict, offlineReply, WELCOME } from "@/features/assistant/offline";
import { parseFaqPairs, parseKnowledgeFile } from "@/features/knowledge/knowledge";

/**
 * The owner's acceptance questions for Ask AIDA (FAQ mode), answered from the real
 * knowledge-base files. Each answer must be the specific one asked for, in the
 * visitor's language, with a link to the relevant page.
 */
const dir = path.resolve("knowledge/aida");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")));
const faq = parseFaqPairs(files.find((f) => f.key === "faq")!.body).map((p, i) => ({ id: `faq${i}`, ...p }));
const ask = (q: string, previous: string[] = []) => offlineReply(q, { faq, sections: files }, { previousUserMessages: previous });

const FEES = "PKR 15,000";
const URDU = /[؀-ۿ]/;

describe("owner's test questions", () => {
  it("1. greets with the exact welcome", () => {
    expect(ask("Aslamoalikum")).toBe(WELCOME);
  });

  it("2. course info: one 10-day live online programme for beginners", () => {
    const r = ask("I need course info.");
    expect(r).toContain("AIDA AI Training Programme");
    expect(r).toContain("10-day");
    expect(r).toContain("beginners");
    expect(r).toContain("no coding");
    expect(r).toMatch(/\/programme/);
  });

  it("3. fee and duration together: both are given", () => {
    const r = ask("How much is the course fee and duration?");
    expect(r).toContain(FEES);
    expect(r).toContain("SAR 200");
    expect(r).toContain("USD 55");
    expect(r).toContain("10 days");
    expect(r).toContain("/fees-admission#fees");
    expect(r).toContain("/programme#schedule");
  });

  it.each(["Is the course fee refundable?", "Can I get my money back?", "What is your refund policy?", "Is there a money-back guarantee?"])(
    "4. refund (%s): the refund policy, not the fees",
    (q) => {
      const r = ask(q);
      expect(r).toContain("100% refund");
      expect(r).toContain("first day");
      expect(r).not.toContain(FEES);
      expect(r).toContain("/fees-admission#refund");
    },
  );

  it("5. major benefit: practical outcomes, not the course description, and no promises", () => {
    const r = ask("What is the major benefit of doing this course?");
    expect(r).toContain("building websites with AI tools");
    expect(r).toContain("AI agents and AI employees");
    expect(r).toContain("source code");
    expect(r).toContain("does not promise employment");
    expect(r).not.toContain("AIDA offers one programme");
    expect(r).toContain("/programme#benefits");
  });

  it.each(["Can you assist me after completion of the course?", "How can I consult previous students?"])(
    "6–7. after the course (%s): student-run WhatsApp groups, not AIDA-managed",
    (q) => {
      const r = ask(q);
      expect(r).toMatch(/^After the course/);
      expect(r).toContain("WhatsApp groups");
      expect(r).toContain("previous students");
      expect(r).toContain("not managed by AIDA");
      expect(r).toContain("/programme#support");
    },
  );

  it("8. academy number: phone, email and the Contact page", () => {
    const r = ask("Get me the academy number.");
    expect(r).toContain("+92 322 720 4898");
    expect(r).toContain("mentorsvalley@gmail.com");
    expect(r).toContain("/contact");
  });

  it("9. class hours and duration: timing, batches, attendance and recordings", () => {
    const r = ask("Tell me the class hours and duration.");
    for (const fact of ["10 days", "9:00 PM", "10:00 PM", "1st–10th", "11th–20th", "21st–30th", "at least 8 days", "do not replace attendance"]) {
      expect(r).toContain(fact);
    }
  });

  it("10. instructor: only the knowledge base's founder credentials, not the course description", () => {
    const r = ask("Who is your instructor?");
    expect(r).toContain("Muhammad Ejaz");
    expect(r).toContain("10 Anthropic Claude Academy certifications");
    expect(r).not.toContain("AIDA offers one programme");
    expect(r).toContain("/founder");
  });

  it("11. Urdu refund question: Urdu refund answer without the fees", () => {
    const r = ask("کیا کورس کی فیس واپس ہو سکتی ہے؟");
    expect(r).toMatch(URDU);
    expect(r).toContain("100%");
    expect(r).toContain("واپس");
    expect(r).not.toContain(FEES);
    expect(r).toContain("مزید معلومات: /fees-admission#refund");
  });

  it("12. Urdu benefits question: Urdu benefits answer", () => {
    const r = ask("کورس کے اہم فوائد کیا ہیں؟");
    expect(r).toContain("سب سے بڑا فائدہ");
    expect(r).toContain("/programme#benefits");
  });

  it("13. Urdu after-course guidance: student WhatsApp groups", () => {
    const r = ask("کیا کورس مکمل ہونے کے بعد بھی رہنمائی مل سکتی ہے؟");
    expect(r).toMatch(/^کورس کے بعد/);
    expect(r).toContain("واٹس ایپ گروپس");
    expect(r).toContain("AIDA کے زیرِ انتظام نہیں");
  });

  it("14. Roman Urdu seniors question: Roman Urdu answer about student groups", () => {
    const r = ask("Course complete karne ke baad kya main seniors se mashwara kar sakta hoon?");
    expect(r).toMatch(/^Course ke baad/);
    expect(r).toContain("seniors se mashwara");
    expect(r).toContain("AIDA manage nahi karta");
    expect(r).toContain("Mazeed maloomat: /programme#support");
  });

  it("15. Roman Urdu class timings", () => {
    const r = ask("Class timings kya hain?");
    expect(r).toContain("raat 9:00 PM se 10:00 PM");
    expect(r).toContain("attendance ka mutabadil nahi");
  });
});

describe("same questions in English, Urdu and Roman Urdu give the same facts", () => {
  const sets: Array<{ topic: string; en: string; urdu: string; roman: string; facts: string[] }> = [
    { topic: "fees", en: "What is the course fee?", urdu: "کورس کی فیس کتنی ہے؟", roman: "Course ki fee kitni hai?", facts: ["PKR 15,000", "SAR 200", "USD 55"] },
    { topic: "refund", en: "Is the course fee refundable?", urdu: "کیا فیس واپس ہو سکتی ہے؟", roman: "Kya fee wapas milti hai?", facts: ["100%"] },
    { topic: "timings", en: "What are the class timings?", urdu: "کلاس کے اوقات کیا ہیں؟", roman: "Class timings kya hain?", facts: ["9:00 PM", "10:00 PM", "8"] },
    { topic: "contact", en: "What is the academy contact number?", urdu: "اکیڈمی کا نمبر کیا ہے؟", roman: "Academy ka number kya hai?", facts: ["+92 322 720 4898", "mentorsvalley@gmail.com"] },
    { topic: "instructor", en: "Who is the instructor?", urdu: "استاد کون ہیں؟", roman: "Instructor kaun hai?", facts: ["Muhammad Ejaz", "10"] },
    { topic: "benefits", en: "What are the benefits?", urdu: "فوائد کیا ہیں؟", roman: "Is course ka kya fayda hai?", facts: ["AI"] },
    { topic: "admission", en: "How do I apply?", urdu: "داخلہ کیسے لیں؟", roman: "Admission kaise lein?", facts: ["+92 322 720 4898", "/admission"] },
  ];

  it.each(sets)("$topic", ({ en, urdu, roman, facts }) => {
    const rEn = ask(en);
    const rUrdu = ask(urdu);
    const rRoman = ask(roman);
    for (const fact of facts) {
      expect(rEn).toContain(fact);
      expect(rUrdu).toContain(fact);
      expect(rRoman).toContain(fact);
    }
    expect(rEn).not.toMatch(URDU);
    expect(rUrdu).toMatch(URDU);
    expect(rRoman).not.toMatch(URDU);
    expect(rRoman).toMatch(/Mazeed maloomat|^Course|aap|hai/);
  });
});

describe("language follows the conversation", () => {
  it("detects each language and stays neutral for unclear messages", () => {
    expect(detectLanguageStrict("What is the course fee?")).toBe("en");
    expect(detectLanguageStrict("کورس کی فیس کتنی ہے؟")).toBe("urdu");
    expect(detectLanguageStrict("Course ki fee kitni hai?")).toBe("roman");
    expect(detectLanguageStrict("laptop?")).toBeNull();
  });

  it("keeps the earlier language for an unclear follow-up", () => {
    expect(conversationLanguage("laptop?", ["Course ki fee kitni hai?"])).toBe("roman");
    expect(ask("laptop?", ["کورس کی فیس کتنی ہے؟"])).toMatch(URDU);
    expect(ask("laptop?", ["What is the fee?"])).toContain("More details:");
  });

  it("switches when the visitor switches language", () => {
    const history = ["What is the course fee?"];
    expect(ask("Class timings kya hain?", history)).toContain("Mazeed maloomat");
    expect(ask("کلاس کب ہوتی ہے؟", [...history, "Class timings kya hain?"])).toMatch(URDU);
  });

  it("follows an explicit request, and keeps it for later unclear messages", () => {
    expect(ask("Please reply in Urdu")).toBe("ضرور — میں اردو میں جواب دوں گی۔ میں آپ کی کیا مدد کر سکتی ہوں؟");
    expect(ask("fee? urdu mein batain")).toContain("کورس فیس");
    expect(ask("refund?", ["Please reply in Roman Urdu"])).toContain("Mazeed maloomat");
    expect(ask("What is the fee? Answer in English please", ["کورس کی فیس کتنی ہے؟"])).toContain("More details:");
  });

  it("acknowledges unknown information and points to Reception, in the visitor's language", () => {
    expect(ask("Do you provide hostel accommodation?")).toMatch(/couldn't find that[\s\S]*\+92 322 720 4898[\s\S]*\/contact/);
    expect(ask("hostel ka intezam hai kya?")).toMatch(/^Maazrat/);
    expect(ask("کیا ہاسٹل کی سہولت ہے؟")).toMatch(/^معذرت/);
  });
});
