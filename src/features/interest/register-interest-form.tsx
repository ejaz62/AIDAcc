"use client";

import Link from "next/link";
import { Suspense, useActionState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { registerInterest } from "./actions";
import { LIMITS, learnerTypes } from "./schema";
import type { InterestFormState } from "./types";

const initialState: InterestFormState = { status: "idle" };

export interface ProgrammeOption {
  id: string;
  slug: string;
  title: string;
}

/** Programme dropdown; pre-selects the programme named in ?programme=<slug>. */
function ProgrammeSelect({ options, value, invalid }: { options: ProgrammeOption[]; value?: string; invalid: boolean }) {
  const slug = useSearchParams().get("programme");
  const fromUrl = options.find((o) => o.slug === slug)?.id;
  return <ProgrammeSelectInput options={options} value={value ?? fromUrl ?? ""} invalid={invalid} />;
}

function ProgrammeSelectInput({ options, value, invalid }: { options: ProgrammeOption[]; value: string; invalid: boolean }) {
  return (
    <div className="relative">
      <select
        id="programme"
        name="programme"
        defaultValue={value}
        key={value}
        aria-invalid={invalid}
        aria-describedby={describedBy("programme", { error: invalid })}
        className={cn(inputClasses(invalid), "appearance-none pr-11")}
      >
        <option value="">No particular programme</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.title}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
    </div>
  );
}

export function RegisterInterestForm({ programmes = [] }: { programmes?: ProgrammeOption[] }) {
  const [state, formAction, pending] = useActionState(registerInterest, initialState);
  const tokenRef = useRef<string | null>(null);
  const startedRef = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") tokenRef.current = null; // fresh token for any later submission
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  // Attach anti-duplicate token and fill-time marker before the request is sent.
  const submit = (formData: FormData) => {
    tokenRef.current ??= crypto.randomUUID();
    formData.set("formToken", tokenRef.current);
    formData.set("startedAt", String(startedRef.current));
    formAction(formData);
  };

  if (state.status === "success") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-(--radius-card) border border-emerald-200 bg-emerald-50 p-8 text-center outline-none"
      >
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold text-ink-950">Interest registered</h2>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-700">{state.message}</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-brand-700 hover:text-brand-800">
          Return to the homepage
        </Link>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={submit} noValidate className="space-y-6" aria-describedby="form-status">
      <div id="form-status" ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {state.status === "error" && (
          <div className="flex gap-3 rounded-(--radius-control) border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>{state.message}</p>
          </div>
        )}
      </div>

      <Field id="fullName" label="Full name" error={errors.fullName}>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          minLength={LIMITS.nameMin}
          maxLength={LIMITS.nameMax}
          defaultValue={values.fullName}
          aria-invalid={!!errors.fullName}
          aria-describedby={describedBy("fullName", { error: !!errors.fullName })}
          className={inputClasses(!!errors.fullName)}
        />
      </Field>

      <Field id="email" label="Email address" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={LIMITS.emailMax}
          defaultValue={values.email}
          aria-invalid={!!errors.email}
          aria-describedby={describedBy("email", { error: !!errors.email })}
          className={inputClasses(!!errors.email)}
        />
      </Field>

      <Field id="learnerType" label="Which best describes you?" error={errors.learnerType}>
        <div className="relative">
        <select
          id="learnerType"
          name="learnerType"
          required
          defaultValue={values.learnerType ?? ""}
          aria-invalid={!!errors.learnerType}
          aria-describedby={describedBy("learnerType", { error: !!errors.learnerType })}
          className={cn(inputClasses(!!errors.learnerType), "appearance-none pr-11")}
        >
          <option value="" disabled>
            Select an option
          </option>
          {learnerTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500"
          aria-hidden
        />
        </div>
      </Field>

      {programmes.length > 0 && (
        <Field id="programme" label="Programme you are interested in" optional error={errors.programme}>
          <Suspense fallback={<ProgrammeSelectInput options={programmes} value={values.programme ?? ""} invalid={!!errors.programme} />}>
            <ProgrammeSelect options={programmes} value={values.programme} invalid={!!errors.programme} />
          </Suspense>
        </Field>
      )}

      <Field
        id="message"
        label="Anything you would like us to know?"
        hint="For example, what you hope to learn or any questions you have."
        optional
        error={errors.message}
      >
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={LIMITS.messageMax}
          defaultValue={values.message}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message", { hint: true, error: !!errors.message })}
          className={cn(inputClasses(!!errors.message), "resize-y")}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive technology; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company_website">Leave this field empty</label>
        <input id="company_website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <div className="flex gap-3">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            required
            defaultChecked={values.consent === "on"}
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy("consent", { error: !!errors.consent })}
            className="mt-1 size-5 shrink-0 rounded border-ink-300 accent-brand-600"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-ink-700">
            I agree to AIDA storing these details to contact me about its programmes, as described in the{" "}
            <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
              privacy notice
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-sm font-medium text-red-600">
            {errors.consent}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Submitting…" : "Register my interest"}
      </Button>
    </form>
  );
}
