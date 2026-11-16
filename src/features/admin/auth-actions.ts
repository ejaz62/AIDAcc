"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getClientIpHash } from "@/lib/request";
import { AUDIT_ACTIONS, writeAudit } from "./audit";
import { isLoginThrottled, type LoginAttemptStore } from "./login-throttle";
import { getAdminUser, SIGN_IN_PATH } from "./session";

export type SignInState = { error?: string; email?: string };

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(1).max(128),
});

const GENERIC_ERROR = "Incorrect email or password.";

function attemptStore(): LoginAttemptStore {
  const db = getDb();
  return {
    countFailures: (where, since) =>
      db.loginAttempt.count({ where: { ...where, success: false, createdAt: { gte: since } } }),
    record: async (a) => {
      await db.loginAttempt.create({ data: a });
    },
  };
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const typedEmail = typeof formData.get("email") === "string" ? String(formData.get("email")).slice(0, 254) : "";
  if (!parsed.success) return { error: "Enter your email address and password.", email: typedEmail };
  const { email, password } = parsed.data;

  let signedIn = false;
  try {
    const store = attemptStore();
    const ipHash = await getClientIpHash();
    if (await isLoginThrottled(store, email, ipHash, new Date())) {
      return { error: "Too many failed attempts. Please wait 15 minutes and try again.", email };
    }

    try {
      await getAuth().api.signInEmail({ body: { email, password, rememberMe: false }, headers: await headers() });
      signedIn = true;
    } catch {
      // Wrong password, unknown email and disabled accounts all look the same to the visitor.
      signedIn = false;
    }

    await store.record({ email, ipHash, success: signedIn });
    const user = signedIn ? await getDb().user.findUnique({ where: { email }, select: { id: true } }) : null;
    await writeAudit(
      getDb(),
      { id: user?.id ?? null, email },
      signedIn ? AUDIT_ACTIONS.signIn : AUDIT_ACTIONS.signInFailed,
    );
  } catch (err) {
    console.error("[signIn] failed:", err instanceof Error ? err.message : err);
    return { error: "Sign-in is temporarily unavailable. Please try again later.", email };
  }

  if (!signedIn) return { error: GENERIC_ERROR, email };
  redirect("/admin");
}

export async function signOut() {
  const user = await getAdminUser();
  await getAuth().api.signOut({ headers: await headers() });
  if (user) await writeAudit(getDb(), user, AUDIT_ACTIONS.signOut);
  redirect(SIGN_IN_PATH);
}
