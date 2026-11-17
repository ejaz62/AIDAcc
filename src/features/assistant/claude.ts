import Anthropic from "@anthropic-ai/sdk";
import { ASSISTANT_INSTRUCTIONS } from "./knowledge";

export const ASSISTANT_MODEL = "claude-opus-5-5";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export class AssistantUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssistantUnavailableError";
  }
}

/** True when an Anthropic API key is configured (ANTHROPIC_API_KEY). */
export function isAiConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  client ??= new Anthropic({ timeout: 45_000, maxRetries: 1 });
  return client;
}

/**
 * Asks Claude for the next reply. The stable instructions + published-content
 * knowledge are cached (prompt caching) since they change rarely.
 * Throws AssistantUnavailableError on any failure so callers can fall back.
 */
export async function generateAiReply(knowledge: string, history: ChatTurn[], anthropic: Anthropic = getClient()) {
  try {
    const response = await anthropic.beta.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: [
        { type: "text", text: ASSISTANT_INSTRUCTIONS },
        {
          type: "text",
          text: `<reference_material>\n${knowledge}\n</reference_material>`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: history.map((t) => ({ role: t.role, content: t.content })),
    });

    if (response.stop_reason === "refusal") {
      return "I'm sorry, I can't help with that. I can answer questions about AIDA and its published programmes.";
    }
    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) throw new AssistantUnavailableError("Empty response");
    return text;
  } catch (err) {
    if (err instanceof AssistantUnavailableError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new AssistantUnavailableError("Invalid API key");
    if (err instanceof Anthropic.RateLimitError) throw new AssistantUnavailableError("Provider rate limit");
    if (err instanceof Anthropic.APIError) throw new AssistantUnavailableError(`Provider error ${err.status}`);
    throw new AssistantUnavailableError(err instanceof Error ? err.name : "Unknown error");
  }
}
