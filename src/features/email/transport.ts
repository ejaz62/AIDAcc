/**
 * Email delivery. Two transports:
 *  - "preview" (default): nothing leaves the server; messages are recorded for viewing in Admin → Emails.
 *  - "resend": sends through the Resend HTTP API (https://resend.com), using RESEND_API_KEY.
 *
 * Configuration (environment variables):
 *   EMAIL_PROVIDER   "resend" to send real email; anything else = preview
 *   RESEND_API_KEY   API key from Resend (required for "resend")
 *   EMAIL_FROM       Sender, e.g. "AIDA <noreply@your-verified-domain>" (required for "resend")
 *   EMAIL_REPLY_TO   Optional reply-to address
 */

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTransport {
  name: "preview" | "resend";
  /** False for preview: messages are recorded but not delivered. */
  delivers: boolean;
  send(message: OutgoingEmail): Promise<{ providerId?: string }>;
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    /** Permanent errors (e.g. invalid address) are not retried. */
    readonly permanent = false,
  ) {
    super(message);
    this.name = "EmailSendError";
  }
}

export const previewTransport: EmailTransport = {
  name: "preview",
  delivers: false,
  async send() {
    return {};
  },
};

export function createResendTransport(opts: {
  apiKey: string;
  from: string;
  replyTo?: string;
  fetchImpl?: typeof fetch;
}): EmailTransport {
  const doFetch = opts.fetchImpl ?? fetch;
  return {
    name: "resend",
    delivers: true,
    async send(message) {
      let res: Response;
      try {
        res = await doFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: opts.from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
          }),
          signal: AbortSignal.timeout(15_000),
        });
      } catch (err) {
        throw new EmailSendError(`Network error contacting the email provider: ${err instanceof Error ? err.name : "unknown"}`);
      }
      if (res.ok) {
        const body = (await res.json().catch(() => ({}))) as { id?: string };
        return { providerId: body.id };
      }
      // Only the provider's short message is kept — never request headers (which contain the key).
      const body = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
      const detail = `${res.status} ${body.name ?? ""} ${body.message ?? ""}`.trim().slice(0, 300);
      const permanent = res.status === 400 || res.status === 403 || res.status === 422;
      throw new EmailSendError(`Email provider rejected the message: ${detail}`, permanent);
    },
  };
}

export interface EmailConfigStatus {
  provider: "preview" | "resend";
  /** Present when EMAIL_PROVIDER=resend but required settings are missing. */
  problem?: string;
  from?: string;
}

/** Resolves the transport from environment variables. Misconfiguration falls back to preview. */
export function resolveTransport(env: Record<string, string | undefined> = process.env): { transport: EmailTransport; status: EmailConfigStatus } {
  if (env.EMAIL_PROVIDER !== "resend") {
    return { transport: previewTransport, status: { provider: "preview" } };
  }
  const missing = [!env.RESEND_API_KEY && "RESEND_API_KEY", !env.EMAIL_FROM && "EMAIL_FROM"].filter(Boolean);
  if (missing.length) {
    return {
      transport: previewTransport,
      status: { provider: "preview", problem: `EMAIL_PROVIDER is "resend" but ${missing.join(" and ")} ${missing.length > 1 ? "are" : "is"} not set.` },
    };
  }
  return {
    transport: createResendTransport({ apiKey: env.RESEND_API_KEY!, from: env.EMAIL_FROM!, replyTo: env.EMAIL_REPLY_TO || undefined }),
    status: { provider: "resend", from: env.EMAIL_FROM },
  };
}
