"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { changeAdmissionStatus, createAdmissionNote, removeAdmission, type AdmissionActionState } from "./admin-actions";
import { ADMISSION_STATUSES } from "./schema";

function Feedback({ state, success }: { state: AdmissionActionState; success?: string }) {
  if (state.error) return <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>;
  if (state.ok && success) return <p className="mt-2 text-sm font-medium text-emerald-700">{success}</p>;
  return null;
}

export function AdmissionStatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState<AdmissionActionState, FormData>(changeAdmissionStatus.bind(null, id), {});
  return (
    <form action={action}>
      <label htmlFor="status" className="text-sm font-semibold text-ink-800">
        Status
      </label>
      <div className="mt-2 flex gap-2">
        <select id="status" name="status" defaultValue={status} key={status} className={cn(inputClasses(), "py-2.5")}>
          {ADMISSION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : "Save"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-ink-500">Mark as Confirmed only after you have verified the payment.</p>
      <div aria-live="polite">
        <Feedback state={state} success="Status updated." />
      </div>
    </form>
  );
}

export function AdmissionNoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<AdmissionActionState, FormData>(createAdmissionNote.bind(null, id), {});
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
        maxLength={2000}
        required
        placeholder="Add an internal note, e.g. 'Called on WhatsApp, prefers batch 11–20'"
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

export function AdmissionDeleteForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<AdmissionActionState, FormData>(removeAdmission.bind(null, id), {});
  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="text-red-700 ring-red-200 hover:bg-red-50 hover:ring-red-300">
        <Trash2 className="size-4" aria-hidden /> Delete permanently…
      </Button>
    );
  }
  return (
    <form action={action} className="space-y-4 rounded-(--radius-control) border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-900">
        This permanently deletes this application and its notes. It cannot be undone.
      </p>
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
        <Button type="submit" disabled={pending} className="bg-red-600 text-white hover:bg-red-700 hover:shadow-none active:bg-red-800">
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
