/** The signed-in staff member, as exposed to admin pages and actions. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionLike {
  user?: { id?: unknown; name?: unknown; email?: unknown; role?: unknown; disabled?: unknown } | null;
}

export const ADMIN_ROLES = ["admin"] as const;

/**
 * Decides whether a session may use the admin area.
 * Pure function so the access rules are unit-tested independently of cookies.
 */
export function authorize(session: SessionLike | null | undefined): AdminUser | null {
  const u = session?.user;
  if (!u || typeof u.id !== "string" || typeof u.email !== "string") return null;
  if (u.disabled === true) return null;
  if (typeof u.role !== "string" || !(ADMIN_ROLES as readonly string[]).includes(u.role)) return null;
  return { id: u.id, name: typeof u.name === "string" ? u.name : u.email, email: u.email, role: u.role };
}
