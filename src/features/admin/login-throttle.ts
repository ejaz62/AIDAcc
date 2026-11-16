export const LOGIN_POLICY = {
  windowMs: 15 * 60 * 1000,
  /** Failed attempts allowed per email address within the window. */
  maxFailuresPerEmail: 5,
  /** Failed attempts allowed per (hashed) IP within the window. */
  maxFailuresPerIp: 20,
} as const;

export interface LoginAttemptStore {
  countFailures(where: { email?: string; ipHash?: string }, since: Date): Promise<number>;
  record(attempt: { email: string; ipHash: string; success: boolean }): Promise<void>;
}

/** Returns true when further sign-in attempts must be refused for now. */
export async function isLoginThrottled(
  store: LoginAttemptStore,
  email: string,
  ipHash: string,
  now: Date,
): Promise<boolean> {
  const since = new Date(now.getTime() - LOGIN_POLICY.windowMs);
  const [byEmail, byIp] = await Promise.all([
    store.countFailures({ email }, since),
    store.countFailures({ ipHash }, since),
  ]);
  return byEmail >= LOGIN_POLICY.maxFailuresPerEmail || byIp >= LOGIN_POLICY.maxFailuresPerIp;
}
