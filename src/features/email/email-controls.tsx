"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, RotateCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryEmails, sendTestEmail, setNotificationMode, type EmailActionState } from "./actions";

function Feedback({ state }: { state: EmailActionState }) {
  if (state.error) return <p className="text-sm font-medium text-red-600">{state.error}</p>;
  if (state.ok && state.message) return <p className="text-sm font-medium text-emerald-700">{state.message}</p>;
  return null;
}

export function EmailToolbar({ hasFailed }: { hasFailed: boolean }) {
  const [state, setState] = useState<EmailActionState>({});
  const [pending, start] = useTransition();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => start(async () => setState(await sendTestEmail()))}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          Send me a test email
        </Button>
        {hasFailed && (
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => setState(await retryEmails()))}>
            <RotateCw className="size-4" aria-hidden /> Retry failed emails
          </Button>
        )}
      </div>
      <div aria-live="polite">
        <Feedback state={state} />
      </div>
    </div>
  );
}

const MODES = [
  { value: "NONE", label: "No emails", hint: "Check the admin area yourself." },
  { value: "INSTANT", label: "Instant alerts", hint: "One email for each new registration (name, type and programme only)." },
  { value: "DAILY", label: "Daily summary", hint: "One email a day with counts only, sent when there were new registrations." },
] as const;

export function NotificationPreference({ current }: { current: string }) {
  const [state, action, pending] = useActionState<EmailActionState, FormData>(setNotificationMode, {});
  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="mb-3 text-sm text-muted">Emails about new registrations of interest</legend>
        <div className="space-y-2">
          {MODES.map((m) => (
            <label
              key={m.value}
              className="flex cursor-pointer gap-3 rounded-(--radius-control) border border-border p-3.5 has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50"
            >
              <input type="radio" name="notificationMode" value={m.value} defaultChecked={current === m.value} className="mt-1 size-4 accent-brand-600" />
              <span>
                <span className="block text-sm font-semibold text-ink-900">{m.label}</span>
                <span className="block text-sm text-ink-600">{m.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Save preference
        </Button>
        <div aria-live="polite">
          <Feedback state={state} />
        </div>
      </div>
    </form>
  );
}
