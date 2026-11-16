import { describe, expect, it } from "vitest";
import { interestSchema } from "@/features/interest/schema";

const valid = {
  fullName: "  Grace Hopper ",
  email: "  Grace.Hopper@Example.COM ",
  learnerType: "PROFESSIONAL",
  message: "",
  consent: "on",
};

const errorFor = (input: Record<string, unknown>, field: string) => {
  const r = interestSchema.safeParse(input);
  expect(r.success).toBe(false);
  return r.error?.issues.find((i) => i.path[0] === field)?.message;
};

describe("interestSchema", () => {
  it("accepts valid input and normalises it", () => {
    const r = interestSchema.parse(valid);
    expect(r.fullName).toBe("Grace Hopper");
    expect(r.email).toBe("grace.hopper@example.com");
    expect(r.message).toBeUndefined();
  });

  it("requires a full name of sensible length", () => {
    expect(errorFor({ ...valid, fullName: "A" }, "fullName")).toMatch(/full name/i);
    expect(errorFor({ ...valid, fullName: "x".repeat(121) }, "fullName")).toMatch(/120/);
    expect(errorFor({ ...valid, fullName: undefined }, "fullName")).toBeDefined();
  });

  it("rejects markup characters in names", () => {
    expect(errorFor({ ...valid, fullName: "<script>" }, "fullName")).toMatch(/not allowed/);
  });

  it("validates email addresses", () => {
    expect(errorFor({ ...valid, email: "not-an-email" }, "email")).toMatch(/valid email/i);
    expect(errorFor({ ...valid, email: `${"a".repeat(250)}@x.com` }, "email")).toBeDefined();
  });

  it("only allows known learner types", () => {
    expect(errorFor({ ...valid, learnerType: "HACKER" }, "learnerType")).toMatch(/describes you/);
    expect(errorFor({ ...valid, learnerType: undefined }, "learnerType")).toBeDefined();
  });

  it("requires privacy consent", () => {
    expect(errorFor({ ...valid, consent: undefined }, "consent")).toMatch(/privacy notice/);
    expect(errorFor({ ...valid, consent: "yes" }, "consent")).toBeDefined();
  });

  it("limits message length and links", () => {
    expect(errorFor({ ...valid, message: "x".repeat(1001) }, "message")).toMatch(/1000/);
    expect(
      errorFor({ ...valid, message: "see https://a.com https://b.com www.c.com" }, "message"),
    ).toMatch(/links/);
    expect(interestSchema.parse({ ...valid, message: "one link https://a.com" }).message).toContain("https");
  });
});
