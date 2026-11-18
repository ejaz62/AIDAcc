import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

import { AssistantUnavailableError, type ChatTurn } from "./claude";
import { offlineReply, type AnswerSources } from "./offline";

export const ASSISTANT_LIMITS = {
  messageMax: 1000,
  /** Visitor messages allowed per hashed IP in the window. */
  rateLimitMax: 20,
  rateLimitWindowMs: 10 * 60 * 1000,
  /** Messages kept in one conversation (user + assistant). */
  conversationMax: 40,
  /** Recent turns sent to the model as context. */
  historyTurns: 12,
} as const;

export const requestSchema = z.object({
  conversationId: z.string().regex(/^[a-z0-9]{20,40}$/i).optional().nullable(),
  message: z
    .string()
    .trim()
    .min(1, { error: "Please type a question." })
    .max(ASSISTANT_LIMITS.messageMax, { error: `Please keep questions under ${ASSISTANT_LIMITS.messageMax} characters.` }),
});

export type AssistantResult =
  | { ok: true; conversationId: string; reply: string; source: "ai" | "faq" }
  | { ok: false; status: 400 | 429; error: string };

export interface AssistantDeps {
  db: PrismaClient;
  ipHash: string;
  now: Date;
  /** Knowledge-base sections and published FAQ used for FAQ-mode answers. */
  sources: AnswerSources;
  /** Null when no AI provider is configured: answers come from the FAQ. */
  ai: null | ((history: ChatTurn[]) => Promise<string>);
}

/**
 * Handles one visitor message: validate, rate-limit, store, answer (AI with
 * offline fallback), store the answer. Never reveals internal errors.
 */
export async function handleAssistantMessage(raw: unknown, deps: AssistantDeps): Promise<AssistantResult> {
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, status: 400, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const { db, ipHash, now } = deps;
  const { message } = parsed.data;

  const since = new Date(now.getTime() - ASSISTANT_LIMITS.rateLimitWindowMs);
  const recent = await db.assistantMessage.count({
    where: { role: "user", createdAt: { gte: since }, conversation: { ipHash } },
  });
  if (recent >= ASSISTANT_LIMITS.rateLimitMax) {
    return { ok: false, status: 429, error: "You have sent a lot of questions in a short time. Please wait a few minutes." };
  }

  // Continue the visitor's own conversation, or start a new one.
  let conversation = parsed.data.conversationId
    ? await db.assistantConversation.findFirst({
        where: { id: parsed.data.conversationId, ipHash },
        include: { messages: { orderBy: { createdAt: "asc" }, select: { role: true, content: true } } },
      })
    : null;
  if (conversation && conversation.messages.length >= ASSISTANT_LIMITS.conversationMax) {
    return { ok: false, status: 400, error: "This conversation is full. Please start a new one." };
  }
  if (!conversation) {
    conversation = { ...(await db.assistantConversation.create({ data: { ipHash } })), messages: [] };
  }

  await db.assistantMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message, source: "visitor" },
  });

  const history: ChatTurn[] = [
    ...conversation.messages.map((m) => ({ role: m.role as ChatTurn["role"], content: m.content })),
    { role: "user" as const, content: message },
  ].slice(-ASSISTANT_LIMITS.historyTurns);
  // The API requires the first message to be from the user.
  while (history.length && history[0].role !== "user") history.shift();

  // Earlier visitor messages let FAQ mode keep answering in the conversation's language.
  const previousUserMessages = conversation.messages.filter((m) => m.role === "user").map((m) => m.content);

  let reply: string;
  let source: "ai" | "faq" = "faq";
  if (deps.ai) {
    try {
      reply = await deps.ai(history);
      source = "ai";
    } catch (err) {
      if (!(err instanceof AssistantUnavailableError)) throw err;
      console.error("[assistant] AI unavailable, using FAQ fallback:", err.message);
      reply = offlineReply(message, deps.sources, { previousUserMessages });
    }
  } else {
    reply = offlineReply(message, deps.sources, { previousUserMessages });
  }

  await db.assistantMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply, source } });
  await db.assistantConversation.update({ where: { id: conversation.id }, data: { updatedAt: now } });
  return { ok: true, conversationId: conversation.id, reply, source };
}
