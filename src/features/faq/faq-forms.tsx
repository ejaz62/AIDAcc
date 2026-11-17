"use client";

import { useActionState, useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/form";
import { StatusBadge } from "@/features/admin/ui";
import { cn } from "@/lib/cn";
import { changeFaqStatus, removeFaq, saveFaq, type FaqFormState } from "./actions";

export function FaqForm({
  id,
  initial,
  onDone,
}: {
  id: string | null;
  initial: { question: string; answer: string; sortOrder: number };
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<FaqFormState, FormData>(async (prev, fd) => {
    const result = await saveFaq(id, prev, fd);
    if (result.ok) onDone?.();
    return result;
  }, {});
  const v = state.values ?? { question: initial.question, answer: initial.answer, sortOrder: String(initial.sortOrder) };
  const k = state.values ? "v" : "i";
  const fid = id ?? "new";
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{state.error}</p>}
      <Field id={`q-${fid}`} label="Question">
        <input id={`q-${fid}`} name="question" maxLength={300} defaultValue={v.question} key={`q-${k}`} className={inputClasses()} />
      </Field>
      <Field id={`a-${fid}`} label="Answer" hint="Enter only verified information. The AI Assistant uses published answers.">
        <textarea
          id={`a-${fid}`}
          name="answer"
          rows={5}
          maxLength={4000}
          defaultValue={v.answer}
          key={`a-${k}`}
          aria-describedby={`a-${fid}-hint`}
          className={cn(inputClasses(), "resize-y")}
        />
      </Field>
      <Field id={`s-${fid}`} label="Display order" optional>
        <input
          id={`s-${fid}`}
          name="sortOrder"
          type="number"
          min={0}
          max={9999}
          defaultValue={v.sortOrder}
          key={`s-${k}`}
          className={cn(inputClasses(), "max-w-32")}
        />
      </Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {id ? "Save changes" : "Add as draft"}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function FaqRow({
  entry,
}: {
  entry: { id: string; question: string; answer: string; status: "DRAFT" | "PUBLISHED"; sortOrder: number };
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [state, setState] = useState<FaqFormState>({});
  const [pending, start] = useTransition();
  const published = entry.status === "PUBLISHED";

  if (editing) {
    return (
      <li className="py-5">
        <FaqForm id={entry.id} initial={entry} onDone={() => setEditing(false)} />
      </li>
    );
  }
  return (
    <li className="flex flex-col gap-3 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-950">
          {entry.question}
          <StatusBadge status={published ? "CONTACTED" : "ARCHIVED"} label={published ? "Published" : "Draft"} />
        </p>
        <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-ink-600">{entry.answer}</p>
        {state.error && <p className="mt-1 text-sm font-medium text-red-600">{state.error}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={published ? "secondary" : "primary"}
          disabled={pending}
          onClick={() => start(async () => setState(await changeFaqStatus(entry.id, published ? "DRAFT" : "PUBLISHED")))}
        >
          {published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {published ? "Unpublish" : "Publish"}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden /> Edit
        </Button>
        {confirmDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              disabled={pending}
              className="bg-red-600 hover:bg-red-700 hover:shadow-none"
              onClick={() => start(async () => setState(await removeFaq(entry.id)))}
            >
              Confirm delete
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Delete question: ${entry.question}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}
