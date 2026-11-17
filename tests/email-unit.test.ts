import { describe, expect, it, vi } from "vitest";
import { escapeHtml, NOT_AN_APPLICATION_TEXT, registrantConfirmation, staffAlert, staffDigest } from "@/features/email/templates";
import { createResendTransport, EmailSendError, resolveTransport } from "@/features/email/transport";
import { submitInterest } from "@/features/interest/service";
import { createMemoryRepo, makeForm } from "./helpers";

describe("email templates", () => {
  it("escapes everything a registrant typed", () => {
    const e = registrantConfirmation({ fullName: `<script>alert(1)</script> Smith`, programmeTitle: `A & "B"` });
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("&lt;script&gt;");
    expect(e.html).toContain("A &amp; &quot;B&quot;");
    expect(escapeHtml(`'"<>&`)).toBe("&#39;&quot;&lt;&gt;&amp;");
  });

  it("tells registrants this is not an application, in both formats", () => {
    const e = registrantConfirmation({ fullName: "Grace Hopper" });
    expect(e.text).toContain(NOT_AN_APPLICATION_TEXT);
    expect(e.html).toContain("not an application for admission");
    expect(e.text).toMatch(/^Hello Grace,/);
  });

  it("includes the published contact email only when provided", () => {
    expect(registrantConfirmation({ fullName: "A B" }).text).not.toContain("Questions?");
    expect(registrantConfirmation({ fullName: "A B", footer: { contactEmail: "info@example.test" } }).html).toContain(
      "mailto:info@example.test",
    );
  });

  it("keeps staff alerts free of the registrant's email and message, and subjects single-line", () => {
    const e = staffAlert({ fullName: "Evil\r\nBcc: x@y.z", learnerTypeLabel: "Student", adminUrl: "https://a.test/admin/registrations/1" });
    expect(e.subject).not.toMatch(/[\r\n]/);
    expect(e.html).toContain("https://a.test/admin/registrations/1");
    expect(e.text).not.toContain("@example");
  });

  it("builds a daily digest with counts only", () => {
    const e = staffDigest({
      total: 3,
      byType: [
        { label: "Student or learner", count: 2 },
        { label: "Other", count: 1 },
        { label: "Teacher or educator", count: 0 },
      ],
      dateLabel: "17 Nov 2026",
      adminUrl: "https://a.test/admin/registrations",
    });
    expect(e.subject).toContain("3 new registrations");
    expect(e.text).toContain("Student or learner: 2");
    expect(e.text).not.toContain("Teacher or educator");
  });
});

describe("transport selection", () => {
  it("defaults to preview mode", () => {
    expect(resolveTransport({}).status).toEqual({ provider: "preview" });
  });

  it("falls back to preview and explains when Resend settings are missing", () => {
    const { transport, status } = resolveTransport({ EMAIL_PROVIDER: "resend" });
    expect(transport.name).toBe("preview");
    expect(status.problem).toMatch(/RESEND_API_KEY and EMAIL_FROM are not set/);
  });

  it("uses Resend when fully configured", () => {
    const { transport, status } = resolveTransport({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "AIDA <noreply@example.test>",
    });
    expect(transport.name).toBe("resend");
    expect(status.from).toBe("AIDA <noreply@example.test>");
  });
});

describe("Resend transport", () => {
  const message = { to: "a@example.test", subject: "Hi", html: "<p>Hi</p>", text: "Hi" };

  it("sends the expected request and returns the provider id", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "msg_123" }), { status: 200 }));
    const t = createResendTransport({ apiKey: "re_secret", from: "AIDA <noreply@example.test>", replyTo: "info@example.test", fetchImpl });
    expect(await t.send(message)).toEqual({ providerId: "msg_123" });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_secret");
    expect(JSON.parse(String(init.body))).toMatchObject({ to: ["a@example.test"], reply_to: "info@example.test", text: "Hi" });
  });

  it("reports rejections without leaking the API key, marking 4xx validation errors permanent", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ name: "validation_error", message: "Invalid `to` field" }), { status: 422 }));
    const t = createResendTransport({ apiKey: "re_secret", from: "x@example.test", fetchImpl });
    const err = await t.send(message).catch((e) => e);
    expect(err).toBeInstanceOf(EmailSendError);
    expect(err.permanent).toBe(true);
    expect(err.message).toContain("Invalid `to` field");
    expect(err.message).not.toContain("re_secret");
  });

  it("treats server errors and network failures as temporary", async () => {
    const t500 = createResendTransport({ apiKey: "k", from: "x@example.test", fetchImpl: vi.fn(async () => new Response("{}", { status: 503 })) });
    expect((await t500.send(message).catch((e) => e)).permanent).toBe(false);
    const tNet = createResendTransport({
      apiKey: "k",
      from: "x@example.test",
      fetchImpl: vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    });
    expect((await tNet.send(message).catch((e) => e)).permanent).toBe(false);
  });
});

describe("registration notifications hook", () => {
  const ctx = (onCreated: (id: string) => Promise<void>) => ({
    ipHash: "f".repeat(64),
    now: new Date(),
    generateToken: () => "fallback-token-0002",
    onCreated,
  });
  const tok = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

  it("fires only for brand-new registrations", async () => {
    const { repo } = createMemoryRepo();
    const onCreated = vi.fn(async () => {});
    await submitInterest(makeForm({ formToken: tok(1) }), repo, ctx(onCreated));
    await submitInterest(makeForm({ formToken: tok(2) }), repo, ctx(onCreated)); // duplicate email
    await submitInterest(makeForm({ formToken: tok(1) }), repo, ctx(onCreated)); // replayed token
    expect(onCreated).toHaveBeenCalledTimes(1);
    expect(onCreated).toHaveBeenCalledWith("mem-ada@example.com");
  });

  it("never turns a stored registration into an error when notifications fail", async () => {
    const { repo, registrations } = createMemoryRepo();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await submitInterest(makeForm({ formToken: tok(3) }), repo, ctx(async () => {
      throw new Error("email down");
    }));
    expect(res.status).toBe("success");
    expect(registrations.size).toBe(1);
    spy.mockRestore();
  });
});
