import { describe, expect, it } from "vitest";
import { programmeInputSchema, publishBlockers } from "@/features/content/programmes";
import { EMPTY_SITE_CONTENT, readSiteContent, siteContentSchema } from "@/features/content/site-content";
import { SLUG_RE, slugify } from "@/features/content/slug";
import { generateTemporaryPassword, passwordSchema } from "@/features/admin/users";
import { MESSAGES, submitInterest } from "@/features/interest/service";
import { createMemoryRepo, makeForm } from "./helpers";

describe("slugify", () => {
  it("creates readable web addresses", () => {
    expect(slugify("AI Foundations: Part 1")).toBe("ai-foundations-part-1");
    expect(slugify("  Data & Ethics  ")).toBe("data-and-ethics");
    expect(slugify("École d'été")).toBe("ecole-d-ete");
    expect(slugify("---")).toBe("");
    expect(SLUG_RE.test(slugify("x".repeat(200)))).toBe(true);
  });
});

describe("programmeInputSchema", () => {
  it("derives the slug from the title and nulls empty fields", () => {
    const p = programmeInputSchema.parse({ title: "Applied Machine Learning", summary: "", fees: "  " });
    expect(p.slug).toBe("applied-machine-learning");
    expect(p.summary).toBeNull();
    expect(p.fees).toBeNull();
    expect(p.sortOrder).toBe(0);
  });

  it("rejects invalid slugs and short titles", () => {
    expect(programmeInputSchema.safeParse({ title: "Valid title", slug: "Bad Slug!" }).success).toBe(false);
    expect(programmeInputSchema.safeParse({ title: "AI" }).success).toBe(false);
  });

  it("enforces field limits", () => {
    expect(programmeInputSchema.safeParse({ title: "Valid title", summary: "x".repeat(301) }).success).toBe(false);
  });
});

describe("publishBlockers", () => {
  it("requires a summary and overview before publishing", () => {
    expect(publishBlockers({ title: "T", summary: null, overview: null })).toEqual(["Summary", "Overview"]);
    expect(publishBlockers({ title: "T", summary: "S", overview: "O" })).toEqual([]);
  });
});

describe("site content", () => {
  it("defaults to empty fields with the preview notice on", () => {
    expect(EMPTY_SITE_CONTENT.contactEmail).toBe("");
    expect(EMPTY_SITE_CONTENT.showPreviewNotice).toBe(true);
  });

  it("validates email and phone formats", () => {
    expect(siteContentSchema.safeParse({ contactEmail: "not-an-email" }).success).toBe(false);
    expect(siteContentSchema.safeParse({ contactPhone: "call me" }).success).toBe(false);
    expect(siteContentSchema.safeParse({ contactEmail: "Info@Example.test", contactPhone: "+44 (0)20 1234 5678" }).success).toBe(true);
  });

  it("reads corrupt stored data safely", () => {
    expect(readSiteContent(null)).toEqual(EMPTY_SITE_CONTENT);
    expect(readSiteContent({ contactEmail: 42, mission: "Hello" }).contactEmail).toBe("");
  });
});

describe("temporary passwords", () => {
  it("are strong, unambiguous and unique", () => {
    const a = generateTemporaryPassword();
    const b = generateTemporaryPassword();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-HJ-NP-Za-km-z2-9-]+$/);
    expect(passwordSchema.safeParse(a).success).toBe(true);
  });
});

describe("Register Interest with a programme", () => {
  const ctx = { ipHash: "d".repeat(64), now: new Date(), generateToken: () => "fallback-token-0001" };
  const PUBLISHED = "cmprogpublished000000001";

  it("stores a published programme choice", async () => {
    const { repo, registrations } = createMemoryRepo([PUBLISHED]);
    const res = await submitInterest(makeForm({ programme: PUBLISHED }), repo, ctx);
    expect(res.status).toBe("success");
    expect(registrations.get("ada@example.com")?.programme).toBe(PUBLISHED);
  });

  it("rejects a draft or unknown programme", async () => {
    const { repo, registrations } = createMemoryRepo([PUBLISHED]);
    const res = await submitInterest(makeForm({ programme: "cmprogdraft0000000000001" }), repo, ctx);
    expect(res.status).toBe("error");
    if (res.status === "error") {
      expect(res.message).toBe(MESSAGES.invalid);
      expect(res.fieldErrors?.programme).toMatch(/choose a programme/);
    }
    expect(registrations.size).toBe(0);
  });

  it("treats an empty choice as no programme", async () => {
    const { repo, registrations } = createMemoryRepo();
    await submitInterest(makeForm({ programme: "" }), repo, ctx);
    expect(registrations.get("ada@example.com")?.programme).toBeUndefined();
  });
});
