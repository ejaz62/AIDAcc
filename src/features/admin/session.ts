import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "@/lib/auth";
import { authorize, type AdminUser } from "./authorize";

export const SIGN_IN_PATH = "/admin/sign-in";

/** Reads and authorises the current session once per request. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return authorize(session);
});

/**
 * Data Access Layer guard. Every admin page, action and route handler calls this —
 * the proxy redirect is only an optimisation, never the security boundary.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}
