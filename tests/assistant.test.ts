import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { sslFor } from "@/lib/db-ssl";
import { buildKnowledge } from "@/features/assistant/knowledge";
import { matchFaq, OFFLINE_DEFAULT_REPLY, offlineReply } from "@/features/assistant/offline";
import { AssistantUnavailableError, isAiConfigured } from "@/features/assistant/claude";
import { ASSISTANT_LIMITS, handleAssistantMessage } from "@/features/assistant/service";
import { EMPTY_SITE_CONTENT } from "@/features/content/site-content";
import { STARTER_FAQ } from "@/features/faq/starter-faq";

const faq = STARTER_FAQ.map((f, i) => ({ id: `faq${i}`, ...f }));

describe("offline answers", () => {
  it("matches FAQ questions phrased differently", () => {
    expect(matchFaq("how can I register interest?", faq)?.question).toBe("How do I register my interest?");
    expect(matchFaq("is registering the same as applying for admission", faq)?.question).toMatch(/same as applying/);
  });

  it("gives honest topic guidance instead of inventing facts", () => {
    expect(offlineReply("How much are the tuition fees?", [])).toMatch(/not been published/);
    expect(offlineReply("When is the application deadline?", [])).toMatch(/not an application for admission/);
    expect(offlineReply("Tell me about quantum gardening", [])).toBe(OFFLINE_DEFAULT_REPLY);
  });
});

describe("knowledge", () => {
  it("lists only what was passed in and flags unpublished details", () => {
    const k = buildKnowledge({ programmes: [], site: EMPTY_SITE_CONTENT, faq });
    expect(k).toContain("No programmes have been published yet.");
    expect(k).toContain("Email: (not published yet)");
    expect(k).toContain("How do I register my interest?");
  });

  it("includes published programmes with unconfirmed fields marked", () => {
    const k = buildKnowledge({
      programmes: [
        {
          id: "p1",
          slug: "intro-ai",
          title: "Intro AI",
          summary: "S",
          overview: "O",
          audience: null,
          duration: null,
          studyFormat: null,
          entryRequirements: null,
          fees: null,
        },
      ],
      site: { ...EMPTY_SITE_CONTENT, contactEmail: "info@example.test" },
      faq: [],
    });
    expect(k).toContain("### Intro AI (page: /programmes/intro-ai)");
    expect(k).toContain("Fees: To be confirmed");
    expect(k).toContain("Email: info@example.test");
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

  const deps = (ai: null | ((h: unknown) => Promise<string>)) => ({ db, ipHash, now: new Date(), faq, ai });

  it("answers from the FAQ when no AI is configured, and logs the conversation", async () => {
    const r = await handleAssistantMessage({ message: "How do I register my interest?" }, deps(null));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.source).toBe("faq");
    expect(r.reply).toMatch(/register-interest/);
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
    expect(history.at(-1)?.content).toBe("And fees?");
  });

  it("falls back to the FAQ when the AI is unavailable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await handleAssistantMessage(
      { message: "Is registering interest the same as applying?" },
      deps(async () => {
        throw new AssistantUnavailableError("down");
      }),
    );
    spy.mockRestore();
    expect(r.ok && r.source).toBe("faq");
  });

  it("does not let a visitor continue someone else's conversation", async () => {
    const r = await handleAssistantMessage({ message: "Hi" }, deps(null));
    if (!r.ok) throw new Error("expected ok");
    const other = await handleAssistantMessage(
      { conversationId: r.conversationId, message: "Hi again" },
      { ...deps(null), ipHash: "f".repeat(64) },
    );
    expect(other.ok && other.conversationId).not.toBe(r.conversationId);
    if (other.ok) await db.assistantConversation.delete({ where: { id: other.conversationId } });
  });

  it("validates input and rate-limits", async () => {
    expect(await handleAssistantMessage({ message: "   " }, deps(null))).toMatchObject({ ok: false, status: 400 });
    expect(await handleAssistantMessage({ message: "x".repeat(1001) }, deps(null))).toMatchObject({ ok: false, status: 400 });
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
