import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { sslFor } from "@/lib/db-ssl";
import { buildKnowledge } from "@/features/assistant/knowledge";
import { detectLanguage, isGreeting, matchFaq, offlineReply, rankIntents, WELCOME } from "@/features/assistant/offline";
import { AssistantUnavailableError, isAiConfigured } from "@/features/assistant/claude";
import { ASSISTANT_LIMITS, handleAssistantMessage } from "@/features/assistant/service";
import { EMPTY_SITE_CONTENT } from "@/features/content/site-content";
import { parseFaqPairs, parseKnowledgeFile } from "@/features/knowledge/knowledge";

// The real knowledge base files, exactly as the seed imports them.
const dir = path.resolve("knowledge/aida");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort().map((f) => parseKnowledgeFile(fs.readFileSync(path.join(dir, f), "utf8")));
const sections = files.map(({ key, title, summary, summaryRoman, summaryUrdu, page }) => ({ key, title, summary, summaryRoman, summaryUrdu, page }));
const faq = parseFaqPairs(files.find((f) => f.key === "faq")!.body).map((p, i) => ({ id: `faq${i}`, ...p }));
const sources = { faq, sections };
const ask = (q: string) => offlineReply(q, sources);

describe("knowledge files", () => {
  it("contain all 14 sections with the verified facts", () => {
    expect(files.map((f) => f.key)).toEqual([
      "about", "founder", "programme", "schedule", "curriculum", "fees", "admission",
      "requirements", "support", "certificates", "refund", "faq", "contact", "benefits",
    ]);
    const all = files.map((f) => `${f.summary}\n${f.body}`).join("\n");
    for (const fact of ["PKR 15,000", "SAR 200", "USD 55", "10 days", "9:00 PM", "0322 7204898", "Muhammad Ejaz", "+92 322 720 4898", "mentorsvalley@gmail.com", "8 days", "Claude Pro"]) {
      expect(all).toContain(fact);
    }
    expect(faq.length).toBeGreaterThanOrEqual(10);
  });
});

describe("greetings", () => {
  const greetings = [
    "Assalam-o-Alaikum", "Aslamoalikum", "Assalamu Alaikum", "assalam o alaikum", "AOA", "Salam", "salaam",
    "Hello", "hi", "Hi there", "hey", "Good morning", "good evening", "Hello AIDA", "Asalam u alaikum kaise ho",
    "السلام علیکم", "السلام عليكم", "سلام",
  ];
  it.each(greetings)("recognises %s", (g) => {
    expect(isGreeting(g)).toBe(true);
    expect(ask(g)).toBe(WELCOME);
  });

  it("uses the exact welcome text", () => {
    expect(WELCOME).toBe("Aslamoalikum! Welcome to AIDA. How can I help you today?");
  });

  it("answers the question when a greeting comes with one", () => {
    expect(ask("Assalam o alaikum, fees kitni hai?")).toContain("PKR 15,000");
  });
});

describe("questions in English, Roman Urdu and Urdu", () => {
  const cases: Array<[string, string]> = [
    ["How much is the course fee?", "PKR 15,000"],
    ["fees kitni hai", "USD 55"],
    ["course ki fees kya hai?", "SAR 200"],
    ["فیس کتنی ہے؟", "PKR 15,000"],
    ["What are the class timings?", "9:00 PM"],
    ["class kab hoti hai", "9:00 PM"],
    ["کلاس کا وقت کیا ہے", "9:00 PM"],
    ["How long is the course?", "10 days"],
    ["kitne din ka course hai", "10 din"],
    ["Do I need a laptop?", "laptop"],
    ["kya mobile se class le sakte hain", "laptop"],
    ["Is free ChatGPT enough?", "ChatGPT"],
    ["Will I get a certificate?", "certificate"],
    ["certificate milega?", "certificate"],
    ["Can I get a refund?", "refund"],
    ["paise wapas milenge?", "refund"],
    ["How do I pay?", "Easypaisa"],
    ["easypaisa number kya hai", "0322 7204898"],
    ["How can I register?", "Reception"],
    ["admission kaise lein", "Reception"],
    ["Do I need coding knowledge?", "beginners"],
    ["What will I learn?", "Claude"],
    ["kya sikhaya jayega", "AI"],
    ["contact number", "+92 322 720 4898"],
    ["رابطہ نمبر", "+92 322 720 4898"],
    ["Are recordings available?", "recordings"],
    ["Are there any discounts?", "discount"],
    ["Who is the founder?", "Muhammad Ejaz"],
  ];
  it.each(cases)("%s", (q, expected) => {
    expect(ask(q).toLowerCase()).toContain(expected.toLowerCase());
  });

  it("replies in the visitor's language", () => {
    expect(detectLanguage("What is the fee?")).toBe("en");
    expect(detectLanguage("fees kitni hai")).toBe("roman");
    expect(detectLanguage("فیس کتنی ہے؟")).toBe("urdu");

    const roman = ask("class kab hoti hai");
    expect(roman).toContain("Classes raat 9:00 PM");
    expect(roman).toContain("Mazeed maloomat: /programme");
    expect(ask("refund policy kya hai")).toContain("refund kar di jati hai");
    expect(ask("laptop zaroori hai kya?")).toContain("Laptop zaroori hai");

    const urdu = ask("فیس کتنی ہے؟");
    expect(urdu).toContain("کورس فیس");
    expect(urdu).toContain("مزید معلومات: /fees-admission");

    expect(ask("What is the fee?")).toMatch(/PKR 15,000[\s\S]*More details: \/fees-admission/);
    expect(ask("hostel ka intezam hai kya?")).toMatch(/^Maazrat/);
    expect(ask("کیا ہاسٹل کی سہولت ہے؟")).toMatch(/^معذرت/);
  });

  it("includes a relevant website link", () => {
    expect(ask("fees kitni hai")).toMatch(/\/fees-admission/);
  });

  it("combines two topics when asked about both", () => {
    const r = ask("What is the fee and the class timing?");
    expect(r).toContain("PKR 15,000");
    expect(r).toContain("9:00 PM");
  });

  it("explains honestly and offers Reception when information is unavailable", () => {
    const r = ask("Do you offer hostel accommodation for quantum gardening?");
    expect(r).toMatch(/couldn't find that/);
    expect(r).toContain("+92 322 720 4898");
    expect(isGreeting("hi what is the fee")).toBe(false);
  });

  it("prefers the precise section answer over a loosely matching FAQ entry", () => {
    const pointer = { id: "p", question: "Where can I find programme details and fees?", answer: "See /programme and /fees-admission." };
    const r = offlineReply("fees kitni hai", { faq: [...faq, pointer], sections });
    expect(r).toContain("PKR 15,000");
  });

  it("ranks intents by meaning", () => {
    expect(rankIntents("refund policy kya hai")[0].section).toBe("refund");
    expect(matchFaq("will there be recordings", faq)?.question).toMatch(/recordings/);
  });
});

describe("AI briefing", () => {
  it("puts the knowledge base first", () => {
    const k = buildKnowledge({ programmes: [], site: EMPTY_SITE_CONTENT, faq, sections: files });
    expect(k.indexOf("Course Fees and Payment")).toBeLessThan(k.indexOf("# AIDA"));
    expect(k).toContain("PKR 15,000");
  });

  it("reports whether an API key is configured", () => {
    expect(isAiConfigured({})).toBe(false);
    expect(isAiConfigured({ ANTHROPIC_API_KEY: "sk-test" })).toBe(true);
  });
});

const url = process.env.DATABASE_URL;
const ipHash = `assistant-${randomUUID()}`.padEnd(64, "0").slice(0, 64);

describe.skipIf(!url)("assistant conversations (PostgreSQL)", () => {
  let db: PrismaClient;
  beforeAll(() => {
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url!, max: Number(process.env.DATABASE_POOL_MAX) || undefined, ssl: sslFor(url!) }),
      transactionOptions: { maxWait: 10_000, timeout: 20_000 },
    });
  });
  afterAll(async () => {
    await db.assistantConversation.deleteMany({ where: { ipHash } });
    await db.$disconnect();
  });

  const deps = (ai: null | ((h: unknown) => Promise<string>)) => ({ db, ipHash, now: new Date(), sources, ai });

  it("answers a greeting and logs the conversation", async () => {
    const r = await handleAssistantMessage({ message: "Aslamoalikum" }, deps(null));
    expect(r.ok && r.reply).toBe(WELCOME);
    if (!r.ok) return;
    const msgs = await db.assistantMessage.findMany({ where: { conversationId: r.conversationId }, orderBy: { createdAt: "asc" } });
    expect(msgs.map((m) => [m.role, m.source])).toEqual([
      ["user", "visitor"],
      ["assistant", "faq"],
    ]);
  });

  it("continues a conversation and passes history to the AI", async () => {
    const ai = vi.fn(async (history: unknown) => (history ? "AI reply" : ""));
    const first = await handleAssistantMessage({ message: "Hello" }, deps(ai));
    if (!first.ok) throw new Error("expected ok");
    const second = await handleAssistantMessage({ conversationId: first.conversationId, message: "And fees?" }, deps(ai));
    expect(second.ok && second.source).toBe("ai");
    const history = ai.mock.calls[1][0] as unknown as Array<{ role: string; content: string }>;
    expect(history.map((h) => h.role)).toEqual(["user", "assistant", "user"]);
  });

  it("falls back to FAQ mode when the AI is unavailable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await handleAssistantMessage(
      { message: "fees kitni hai" },
      deps(async () => {
        throw new AssistantUnavailableError("down");
      }),
    );
    spy.mockRestore();
    expect(r.ok && r.source).toBe("faq");
    expect(r.ok && r.reply).toContain("PKR 15,000");
  });

  it("does not let a visitor continue someone else's conversation", async () => {
    const r = await handleAssistantMessage({ message: "Hi" }, deps(null));
    if (!r.ok) throw new Error("expected ok");
    const other = await handleAssistantMessage({ conversationId: r.conversationId, message: "Hi again" }, { ...deps(null), ipHash: "f".repeat(64) });
    expect(other.ok && other.conversationId).not.toBe(r.conversationId);
    if (other.ok) await db.assistantConversation.delete({ where: { id: other.conversationId } });
  });

  it("validates input and rate-limits", async () => {
    expect(await handleAssistantMessage({ message: "   " }, deps(null))).toMatchObject({ ok: false, status: 400 });
    let limited = false;
    for (let i = 0; i < ASSISTANT_LIMITS.rateLimitMax + 1; i++) {
      const r = await handleAssistantMessage({ message: `Question ${i}` }, deps(null));
      if (!r.ok && r.status === 429) {
        limited = true;
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
