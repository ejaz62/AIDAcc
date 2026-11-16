import { describe, expect, it } from "vitest";
import { authorize } from "@/features/admin/authorize";
import { isLoginThrottled, LOGIN_POLICY, type LoginAttemptStore } from "@/features/admin/login-throttle";
import { buildWhere, csvCell, filtersSchema, idSchema, noteSchema, toCsv } from "@/features/admin/registrations";
import { newAdminSchema } from "@/features/admin/users";

describe("authorize (admin access rules)", () => {
  const user = { id: "u1", name: "Staff", email: "staff@example.test", role: "admin", disabled: false };

  it("allows an enabled admin", () => {
    expect(authorize({ user })).toEqual({ id: "u1", name: "Staff", email: "staff@example.test", role: "admin" });
  });

  it("denies missing sessions", () => {
    expect(authorize(null)).toBeNull();
    expect(authorize(undefined)).toBeNull();
    expect(authorize({ user: null })).toBeNull();
  });

  it("denies disabled accounts", () => {
    expect(authorize({ user: { ...user, disabled: true } })).toBeNull();
  });

  it("denies unknown or missing roles", () => {
    expect(authorize({ user: { ...user, role: "student" } })).toBeNull();
    expect(authorize({ user: { ...user, role: undefined } })).toBeNull();
  });

  it("denies malformed users", () => {
    expect(authorize({ user: { ...user, id: 42 } })).toBeNull();
    expect(authorize({ user: { ...user, email: undefined } })).toBeNull();
  });
});

describe("isLoginThrottled", () => {
  const store = (byEmail: number, byIp: number): LoginAttemptStore => ({
    countFailures: async (where) => (where.email ? byEmail : byIp),
    record: async () => {},
  });
  const now = new Date();

  it("allows attempts under the limits", async () => {
    expect(await isLoginThrottled(store(LOGIN_POLICY.maxFailuresPerEmail - 1, 0), "a@x.test", "h", now)).toBe(false);
  });

  it("locks an email after too many failures", async () => {
    expect(await isLoginThrottled(store(LOGIN_POLICY.maxFailuresPerEmail, 0), "a@x.test", "h", now)).toBe(true);
  });

  it("locks an IP after too many failures across emails", async () => {
    expect(await isLoginThrottled(store(0, LOGIN_POLICY.maxFailuresPerIp), "a@x.test", "h", now)).toBe(true);
  });

  it("only counts failures inside the window", async () => {
    let since: Date | undefined;
    await isLoginThrottled(
      { countFailures: async (_w, s) => ((since = s), 0), record: async () => {} },
      "a@x.test",
      "h",
      now,
    );
    expect(now.getTime() - since!.getTime()).toBe(LOGIN_POLICY.windowMs);
  });
});

describe("CSV export helpers", () => {
  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("quotes commas, quotes and newlines", () => {
    expect(csvCell("Smith, Jo")).toBe('"Smith, Jo"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("formats dates and empty values", () => {
    expect(csvCell(new Date("2026-01-02T03:04:05Z"))).toBe("2026-01-02T03:04:05.000Z");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("builds a CSV with a header row", () => {
    const csv = toCsv([{ a: 1, b: "x,y" }], [
      { key: "a", header: "A" },
      { key: "b", header: "B" },
    ]);
    expect(csv).toBe('A,B\r\n1,"x,y"\r\n');
  });
});

describe("registration filters", () => {
  it("parses valid filters", () => {
    expect(filtersSchema.parse({ q: " ada ", status: "NEW", type: "STUDENT", page: "3" })).toEqual({
      q: "ada",
      status: "NEW",
      type: "STUDENT",
      page: 3,
    });
  });

  it("ignores invalid values instead of failing", () => {
    expect(filtersSchema.parse({ status: "DROP TABLE", type: "x", page: "-5" })).toEqual({
      q: undefined,
      status: undefined,
      type: undefined,
      page: 1,
    });
  });

  it("takes the first value of repeated params", () => {
    expect(filtersSchema.parse({ status: ["CONTACTED", "NEW"] }).status).toBe("CONTACTED");
  });

  it("builds a case-insensitive name/email search", () => {
    const where = buildWhere({ q: "ada", status: "NEW", page: 1 });
    expect(where.status).toBe("NEW");
    expect(where.OR).toEqual([
      { fullName: { contains: "ada", mode: "insensitive" } },
      { email: { contains: "ada", mode: "insensitive" } },
    ]);
  });

  it("validates ids and notes", () => {
    expect(idSchema.safeParse("cmabc123def456ghi789jkl0").success).toBe(true);
    expect(idSchema.safeParse("../etc/passwd").success).toBe(false);
    expect(noteSchema.safeParse("   ").success).toBe(false);
    expect(noteSchema.safeParse("x".repeat(2001)).success).toBe(false);
  });
});

describe("new staff account validation", () => {
  it("requires a strong-enough password", () => {
    const base = { name: "Staff Member", email: "staff@example.test" };
    expect(newAdminSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(newAdminSchema.safeParse({ ...base, password: "aaaaaaaaaaaaaaaa" }).success).toBe(false);
    expect(newAdminSchema.safeParse({ ...base, password: "correct-horse-battery" }).success).toBe(true);
  });
});
