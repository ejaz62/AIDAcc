import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { buildKnowledge } from "@/features/assistant/knowledge";
import { generateAiReply, isAiConfigured } from "@/features/assistant/claude";
import { handleAssistantMessage } from "@/features/assistant/service";
import { getPublishedFaq, getPublishedProgrammes, getSiteDetails } from "@/features/content/queries";

/** Rejects cross-site requests: the assistant is only for this website's own pages. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  await connection();
  if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const [site, programmes, faq] = await Promise.all([getSiteDetails(), getPublishedProgrammes(), getPublishedFaq()]);
  if (!site.assistantEnabled) return Response.json({ error: "The assistant is currently switched off." }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const knowledge = buildKnowledge({ programmes, site, faq });
    const result = await handleAssistantMessage(body, {
      db: getDb(),
      ipHash: await getClientIpHash(),
      now: new Date(),
      faq,
      ai: isAiConfigured() ? (history) => generateAiReply(knowledge, history) : null,
    });
    if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
    return Response.json(result);
  } catch (err) {
    console.error("[assistant] request failed:", err instanceof Error ? err.message : err);
    return Response.json({ error: "The assistant is temporarily unavailable. Please try again later." }, { status: 500 });
  }
}
