"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { changeStatus, createNote, removeRegistration, type ActionState } from "./registration-actions";
import { DELETE_REASONS, NOTE_MAX, STATUSES } from "./registrations";

function Feedback({ state, success }: { state: ActionState; success?: string }) {
  if (state.error) return <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>;
  if (state.ok && success) return <p className="mt-2 text-sm font-medium text-emerald-700">{success}</p>;
  return null;
}

export function StatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(changeStatus.bind(null, id), {});
  return (
    <form action={action}>
      <label htmlFor="status" className="text-sm font-semibold text-ink-800">
        Status
      </label>
      <div className="mt-2 flex gap-2">
        <select id="status" name="status" defaultValue={status} key={status} className={cn(inputClasses(), "py-2.5")}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save"}
        </Button>
      </div>
      <div aria-live="polite">
        <Feedback state={state} success="Status updated." />
      </div>
    </form>
  );
}

export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createNote.bind(null, id), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action}>
      <label htmlFor="note" className="sr-only">
        New note
      </label>
      <textarea
        id="note"
        name="body"
        rows={3}
        maxLength={NOTE_MAX}
        required
        placeholder="Add an internal note (visible to staff only)"
        className={cn(inputClasses(!!state.error), "resize-y")}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <div aria-live="polite">
          <Feedback state={state} />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Add note
        </Button>
      </div>
    </form>
  );
}

export function DeleteForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(removeRegistration.bind(null, id), {});

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-red-700 ring-red-200 hover:bg-red-50 hover:ring-red-300"
      >
        <Trash2 className="size-4" aria-hidden /> Delete permanently…
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-(--radius-control) border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        This permanently deletes this person&apos;s details and all notes. It cannot be undone. The audit log will record
        that a deletion happened, without any personal data.
      </p>
      <div>
        <label htmlFor="reason" className="text-sm font-semibold text-ink-800">
          Reason
        </label>
        <select id="reason" name="reason" defaultValue={state.reason ?? ""} key={state.reason} required className={cn(inputClasses(), "mt-2 py-2.5")}>
          <option value="" disabled>
            Choose a reason
          </option>
          {DELETE_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="confirm" className="text-sm font-semibold text-ink-800">
          Type <span className="font-mono">DELETE</span> to confirm
        </label>
        <input id="confirm" name="confirm" autoComplete="off" className={cn(inputClasses(), "mt-2 py-2.5")} />
      </div>
      <div aria-live="polite">
        <Feedback state={state} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending} className="bg-red-600 hover:bg-red-700 hover:shadow-none active:bg-red-800">
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Delete permanently
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
