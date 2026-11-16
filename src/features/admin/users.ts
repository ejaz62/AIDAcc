import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";
import { MIN_PASSWORD_LENGTH, type Auth } from "@/lib/auth-config";
import { AUDIT_ACTIONS, writeAudit } from "./audit";
import type { AdminUser } from "./authorize";

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(128, "Password must be 128 characters or fewer")
  .refine((p) => new Set(p).size >= 6, "Password is too repetitive");

export const staffDetailsSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
});

export const newAdminSchema = staffDetailsSchema.extend({ password: passwordSchema });
export type NewAdmin = z.infer<typeof newAdminSchema>;

type Actor = Pick<AdminUser, "id" | "email"> | { id: null; email: string };
const CLI_ACTOR: Actor = { id: null, email: "system (command line)" };

/** A random, unambiguous temporary password (no 0/O, 1/l/I). */
export function generateTemporaryPassword(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out.replace(/(.{4})(?=.)/g, "$1-");
}

/** Creates a staff account with an email/password credential. */
export async function createAdminUser(auth: Auth, db: PrismaClient, input: NewAdmin, actor: Actor = CLI_ACTOR) {
  const data = newAdminSchema.parse(input);
  if (await db.user.findUnique({ where: { email: data.email } })) {
    throw new Error(`A staff account for ${data.email} already exists.`);
  }
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(data.password);
  const user = await ctx.internalAdapter.createUser(
    { email: data.email, name: data.name, emailVerified: true, role: "admin" },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: hash });
  await writeAudit(
    db,
    actor,
    actor.id ? AUDIT_ACTIONS.staffCreated : AUDIT_ACTIONS.userCreated,
    { type: "user", id: user.id },
  );
  return user;
}

async function setPassword(auth: Auth, db: PrismaClient, userId: string, password: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  const updated = await db.account.updateMany({ where: { userId, providerId: "credential" }, data: { password: hash } });
  if (updated.count === 0) {
    await ctx.internalAdapter.linkAccount({ userId, providerId: "credential", accountId: userId, password: hash });
  }
  // Sign the account out everywhere.
  await db.session.deleteMany({ where: { userId } });
}

/** Sets a new password (CLI) and signs the account out everywhere. */
export async function resetAdminPassword(auth: Auth, db: PrismaClient, email: string, password: string) {
  const data = z.object({ email: staffDetailsSchema.shape.email, password: passwordSchema }).parse({ email, password });
  const user = await db.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error(`No staff account exists for ${data.email}.`);
  await setPassword(auth, db, user.id, data.password);
  await writeAudit(db, CLI_ACTOR, AUDIT_ACTIONS.passwordReset, { type: "user", id: user.id });
  return user;
}

// ---------------------------------------------------------------------------
// Staff management from the admin area
// ---------------------------------------------------------------------------

export function listStaff(db: PrismaClient) {
  return db.user.findMany({
    orderBy: [{ disabled: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true,
      sessions: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
}

/** Creates a staff account with a one-time temporary password, returned to show once. */
export async function inviteStaff(auth: Auth, db: PrismaClient, actor: AdminUser, input: { name: string; email: string }) {
  const details = staffDetailsSchema.parse(input);
  const temporaryPassword = generateTemporaryPassword();
  const user = await createAdminUser(auth, db, { ...details, password: temporaryPassword }, actor);
  return { user, temporaryPassword };
}

export async function resetStaffPassword(auth: Auth, db: PrismaClient, actor: AdminUser, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("This staff account no longer exists.");
  const temporaryPassword = generateTemporaryPassword();
  await setPassword(auth, db, userId, temporaryPassword);
  await writeAudit(db, actor, AUDIT_ACTIONS.staffPasswordReset, { type: "user", id: userId });
  return { user, temporaryPassword };
}

/**
 * Disables or re-enables an account. Staff cannot disable themselves, and the
 * last enabled account can never be disabled (which would lock everyone out).
 */
export async function setStaffDisabled(db: PrismaClient, actor: AdminUser, userId: string, disabled: boolean) {
  if (disabled && userId === actor.id) throw new Error("You cannot disable your own account.");
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("This staff account no longer exists.");
    if (user.disabled === disabled) return user;
    if (disabled && (await tx.user.count({ where: { disabled: false } })) <= 1) {
      throw new Error("At least one staff account must remain enabled.");
    }
    const updated = await tx.user.update({ where: { id: userId }, data: { disabled } });
    if (disabled) await tx.session.deleteMany({ where: { userId } });
    await writeAudit(tx, actor, disabled ? AUDIT_ACTIONS.staffDisabled : AUDIT_ACTIONS.staffEnabled, {
      type: "user",
      id: userId,
    });
    return updated;
  });
}
