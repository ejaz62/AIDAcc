import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { offlineReply, WELCOME } from "@/features/assistant/offline";
import { detectSituation, mentionsAbsence } from "@/features/assistant/situations";
import { parseFaqPairs, parseKnowledgeFile } from "@/features/knowledge/knowledge";

/**
 * Final acceptance tests: the official refund policy (both cases) and context-aware,
 * empathetic replies in English, Urdu and Roman Urdu — without invented promises.
 */
const dir = path.resolve("knowledge/aida");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")));
const faq = parseFaqPairs(files.find((f) => f.key === "faq")!.body).map((p, i) => ({ id: `faq${i}`, ...p }));
const ask = (q: string, previous: string[] = []) => offlineReply(q, { faq, sections: files }, { previousUserMessages: previous });
const URDU = /[؀-ۿ]/;

/** Things the assistant must never promise on AIDA's behalf. */
const FORBIDDEN = [/exempt/i, /extra class/i, /private (class|tuition|lesson)/i, /recordings? (are|is) available (for|until)/i, /percent deduction/i, /\d+% (deduction|will be deducted)/i];
const noForbiddenPromises = (r: string) => {
  for (const p of FORBIDDEN) expect(r).not.toMatch(p);
};

describe("official refund policy", () => {
  it("knowledge base states both cases and the no-deduction rules", () => {
    const refund = files.find((f) => f.key === "refund")!;
    const all = `${refund.summary}\n${refund.body}`;
    for (const fact of ["before the first class", "actual bank or transfer charges", "100%", "first day's class", "without any questions", "No administrative fee"]) {
      expect(all.toLowerCase()).toContain(fact.toLowerCase());
    }
    expect(refund.summaryRoman).toContain("100%");
    expect(refund.summaryUrdu).toContain("100%");
  });

  it.each([
    "Is my fee refundable if I change my mind before the course starts?",
    "If I cancel after paying, how much will I get back?",
    "Will you deduct any administrative charges?",
    "What happens if the bank charges nothing?",
  ])("before the first class (%s): refund minus only actual bank charges, no admin fee", (q) => {
    const r = ask(q);
    expect(r).toMatch(/^Cancellation before the first class/);
    expect(r).toContain("Only actual bank or transfer charges");
    expect(r).toContain("if there are none, you receive 100%");
    expect(r).toContain("no administrative fee");
    expect(r).not.toContain("PKR 15,000");
    expect(r).toContain("/fees-admission#refund");
    noForbiddenPromises(r);
  });

  it("after the first day's class: leads with the 100% no-questions refund", () => {
    const r = ask("What if I am dissatisfied after the first day's class?");
    expect(r).toMatch(/^After the first day's class: if you are dissatisfied, you receive a 100% refund without any questions/);
    expect(r).toContain("Cancellation before the first class"); // the other case is still mentioned
  });

  it("Urdu: refund before the first class, in Urdu script", () => {
    const r = ask("کیا پہلی کلاس سے پہلے فیس واپس مل سکتی ہے؟");
    expect(r).toMatch(/^پہلی کلاس سے پہلے منسوخی/);
    expect(r).toContain("اصل بینک یا ٹرانسفر چارجز");
    expect(r).toContain("100%");
    expect(r).toContain("کوئی انتظامی فیس");
  });

  it("Urdu: dissatisfied after the first day leads with the 100% refund", () => {
    expect(ask("اگر پہلے دن کی کلاس کے بعد مطمئن نہ ہوں تو؟")).toMatch(/^پہلے دن کی کلاس کے بعد/);
  });

  it("Roman Urdu: cancelling before the course starts", () => {
    const r = ask("Agar main course shuru hone se pehle cancel kar doon to kitni fee wapas milegi?");
    expect(r).toMatch(/^Pehli class se pehle cancel/);
    expect(r).toContain("asal bank ya transfer charges");
    expect(r).toContain("100% fee milti hai");
    expect(r).toContain("Mazeed maloomat: /fees-admission#refund");
  });

  it("Roman Urdu: dissatisfied after the first day leads with the 100% refund", () => {
    expect(ask("Agar pehle din ki class ke baad mutmain na hoon to?")).toMatch(/^Pehle din ki class ke baad/);
  });

  it("FAQ answers match the policy", () => {
    const refundable = faq.find((f) => f.question === "Is the course fee refundable?")!;
    expect(refundable.answer).toContain("Before the first class");
    expect(refundable.answer).toContain("only actual bank or transfer charges");
    expect(refundable.answer).toContain("no administrative fee");
  });
});

describe("context-aware, empathetic replies", () => {
  it("eye treatment: care first, the recording, the attendance rule, and get-well wishes", () => {
    const r = ask("I am unable to attend the coming class because I am going for eye treatment.");
    expect(r).toMatch(/^I'm sorry to hear that, and I hope your treatment goes smoothly/);
    expect(r).toContain("class recording to catch up");
    expect(r).toContain("at least 8 of the 10 days");
    expect(r).toMatch(/Wishing you a speedy recovery!$/);
    expect(r).not.toMatch(/doctor|medicine|should take|diagnos/i); // no medical advice
    noForbiddenPromises(r);
  });

  it.each([
    ["work", "I can't attend today's class because of an office meeting.", "work commitments do come up", "All the best with your work!"],
    ["family", "There is a family emergency, I will miss class tomorrow.", "very sorry to hear about this", "Our thoughts are with you."],
    ["travel", "I am travelling next week and will miss two classes.", "have a safe journey", "Safe travels!"],
  ])("%s absence: sympathetic opener, the recording and attendance facts, a kind closing", (_kind, q, opener, closing) => {
    const r = ask(q);
    expect(r).toContain(opener);
    expect(r).toContain("class recording");
    expect(r).toContain("8 of the 10 days");
    expect(r.endsWith(closing)).toBe(true);
    noForbiddenPromises(r);
  });

  it("achievement: congratulations on their own, or with the answer when a question is asked", () => {
    expect(ask("I just launched my first website after the course!")).toBe(
      "Congratulations — that's a wonderful achievement! Keep practising and building; every project makes you stronger.",
    );
    const r = ask("I passed! Do you give a certificate?");
    expect(r).toMatch(/^Congratulations/);
    expect(r).toContain("AIDA certificate");
  });

  it("frustration: acknowledges it and offers help", () => {
    const r = ask("I am frustrated, the class link is not working.");
    expect(r).toMatch(/^I'm sorry this has been frustrating/);
    expect(r).toContain("+92 322 720 4898");
  });

  it("a situation plus a real question gets both the care and the answer", () => {
    const r = ask("I am sick, can I still get a refund?");
    expect(r).toMatch(/^I'm sorry to hear that/);
    expect(r).toContain("100%");
    expect(r).toMatch(/speedy recovery!$/);
  });

  it("Roman Urdu illness and Urdu travel are answered in the same language", () => {
    const roman = ask("Main bimar hoon, aaj class nahi aa sakta.");
    expect(roman).toMatch(/^Yeh sun kar afsos hua/);
    expect(roman).toContain("class ki recording");
    expect(roman).toMatch(/Aap jald sehatyab hon!$/);
    expect(roman).not.toMatch(URDU);

    const urdu = ask("میں سفر پر ہوں، کل کی کلاس میں شامل نہیں ہو سکوں گا۔");
    expect(urdu).toMatch(/^بتانے کا شکریہ/);
    expect(urdu).toContain("ریکارڈنگ");
    expect(urdu).toMatch(/سفر بخیر!$/);
  });

  it("recognises situations and absences without false alarms on ordinary questions", () => {
    expect(detectSituation("What is the course fee?")).toBeNull();
    expect(mentionsAbsence("What are the class timings?")).toBe(false);
    expect(detectSituation("Mera operation hai")).toBe("medical");
    expect(mentionsAbsence("kal chutti hai, class nahi le sakunga")).toBe(true);
    expect(ask("What is the course fee?")).not.toMatch(/sorry|Congratulations/);
  });
});

describe("full conversation and edge cases", () => {
  it("WhatsApp groups are student-run, not official", () => {
    const r = ask("Are the WhatsApp groups official AIDA groups?");
    expect(r).toContain("not managed by AIDA");
  });

  it("an unrelated question is answered honestly with Reception's details", () => {
    const r = ask("What is the weather in Lahore?");
    expect(r).toMatch(/couldn't find that/);
    expect(r).toContain("/contact");
  });

  it("a conversation switching English → Urdu → Roman Urdu keeps facts consistent", () => {
    const history: string[] = [];
    const turn = (q: string) => {
      const r = ask(q, [...history]);
      history.push(q);
      return r;
    };
    expect(turn("Aslamoalikum")).toBe(WELCOME);
    expect(turn("What is the course fee?")).toContain("PKR 15,000");
    const urdu = turn("کورس کی فیس کتنی ہے؟");
    expect(urdu).toMatch(URDU);
    expect(urdu).toContain("PKR 15,000");
    const roman = turn("Class timings kya hain?");
    expect(roman).toContain("raat 9:00 PM se 10:00 PM");
    expect(turn("laptop?")).toContain("Laptop zaroori hai"); // unclear follow-up keeps Roman Urdu
  });

  it("different questions get different answers (no single generic reply)", () => {
    const answers = new Set(
      ["course info", "fee", "refund", "class timings", "benefits", "instructor", "contact number", "certificate"].map((q) => ask(q)),
    );
    expect(answers.size).toBe(8);
  });
});
