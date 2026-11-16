"use client";

import { useActionState, useState, useTransition } from "react";
import { AlertCircle, Check, Copy, KeyRound, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/form";
import { addStaff, changeOwnPassword, resetPasswordFor, setDisabled, type StaffState } from "./staff-actions";

/** Displays a one-time temporary password with a copy button. */
function TemporaryPassword({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="rounded-(--radius-control) border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-semibold">Temporary password for {email}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-white px-3 py-1.5 font-mono text-base tracking-wide text-ink-950 ring-1 ring-emerald-200">
          {password}
        </code>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(password);
              setCopied(true);
            } catch {
              /* clipboard unavailable */
            }
          }}
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-2 text-emerald-800">
        It is shown only once. Share it securely (not by email together with the address) and ask them to change it under
        &ldquo;My account&rdquo; after signing in.
      </p>
    </div>
  );
}

export function AddStaffForm() {
  const [state, action, pending] = useActionState<StaffState, FormData>(addStaff, {});
  return (
    <form action={action} className="space-y-4" noValidate key={state.ok ? state.forEmail : "form"}>
      {state.ok && state.temporaryPassword && state.forEmail && (
        <TemporaryPassword email={state.forEmail} password={state.temporaryPassword} />
      )}
      {state.error && (
        <p className="flex gap-2 text-sm font-medium text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="staff-name" label="Full name">
          <input id="staff-name" name="name" required maxLength={120} defaultValue={state.values?.name} className={inputClasses()} />
        </Field>
        <Field id="staff-email" label="Email address">
          <input
            id="staff-email"
            name="email"
            type="email"
            required
            maxLength={254}
            defaultValue={state.values?.email}
            className={inputClasses()}
          />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
        Add staff member
      </Button>
    </form>
  );
}

export function StaffRowActions({ userId, email, disabled, isSelf }: { userId: string; email: string; disabled: boolean; isSelf: boolean }) {
  const [state, setState] = useState<StaffState>({});
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {!disabled && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              if (confirm(`Reset the password for ${email}? They will be signed out everywhere.`)) {
                start(async () => setState(await resetPasswordFor(userId)));
              }
            }}
          >
            <KeyRound className="size-4" aria-hidden /> Reset password
          </Button>
        )}
        {!isSelf && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            className={disabled ? "" : "text-red-700 hover:bg-red-50"}
            onClick={() => {
              if (disabled || confirm(`Disable ${email}? They will be signed out and unable to sign in.`)) {
                start(async () => setState(await setDisabled(userId, !disabled)));
              }
            }}
          >
            {disabled ? "Re-enable" : "Disable"}
          </Button>
        )}
      </div>
      <div aria-live="polite">
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.ok && state.temporaryPassword && state.forEmail && (
          <TemporaryPassword email={state.forEmail} password={state.temporaryPassword} />
        )}
      </div>
    </div>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<StaffState, FormData>(changeOwnPassword, {});
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <div aria-live="polite">
        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm font-medium text-emerald-700">{state.message}</p>}
      </div>
      <Field id="currentPassword" label="Current password">
        <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputClasses()} />
      </Field>
      <Field id="newPassword" label="New password" hint="At least 12 characters.">
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
          aria-describedby="newPassword-hint"
          className={inputClasses()}
        />
      </Field>
      <Field id="confirmPassword" label="Confirm new password">
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClasses()} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        Change password
      </Button>
    </form>
  );
}
