"use client";

import { HONEYPOT_FIELD, HONEYPOT_INPUT_PROPS } from "@/lib/honeypot";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, describedBy, inputClasses } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { applyForAdmission } from "./actions";
import { AI_EXPERIENCE, BATCHES, COMPUTER_KNOWLEDGE, COURSE_DEFAULT, type AdmissionFormState } from "./schema";

const initialState: AdmissionFormState = { status: "idle" };

function Choice({
  name,
  legend,
  number,
  options,
  value,
  error,
}: {
  name: string;
  legend: string;
  number: number;
  options: readonly { value: string; label: string }[];
  value?: string;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="text-sm font-semibold text-ink-900">
        {number}. {legend} <span className="text-red-400">*</span>
      </legend>
      <div className="mt-3 grid gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-start gap-3 rounded-(--radius-control) border border-ink-300 bg-surface px-4 py-3 text-sm text-ink-800 transition-colors hover:border-brand-500 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
          >
            <input type="radio" name={name} value={o.value} defaultChecked={value === o.value} required className="mt-0.5 size-4 accent-brand-600" />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 text-sm font-medium text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function AdmissionForm({ courses = [COURSE_DEFAULT], whatsappHref }: { courses?: string[]; whatsappHref?: string }) {
  const [state, formAction, pending] = useActionState(applyForAdmission, initialState);
  const tokenRef = useRef<string | null>(null);
  const startedRef = useRef(0);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startedRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (state.status === "success") tokenRef.current = null;
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  const submit = (formData: FormData) => {
    tokenRef.current ??= crypto.randomUUID();
    formData.set("formToken", tokenRef.current);
    formData.set("startedAt", String(startedRef.current));
    formAction(formData);
  };

  if (state.status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-(--radius-card) border border-emerald-500/40 bg-emerald-500/10 p-8 text-center outline-none">
        <CheckCircle2 className="mx-auto size-12 text-emerald-400" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold text-ink-950">Application received</h2>
        <p className="mx-auto mt-3 max-w-lg leading-relaxed text-ink-700">{state.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-(--radius-control) bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              <MessageCircle className="size-4" aria-hidden /> WhatsApp AIDA Reception
            </a>
          )}
          <Link href="/" className="inline-flex items-center rounded-(--radius-control) px-4 py-2.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            Return to the homepage
          </Link>
        </div>
      </div>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  // Remount radio groups/selects after a failed submit so they show the submitted values.
  const k = state.status === "error" ? "e" : "i";

  return (
    <form action={submit} noValidate className="space-y-7" aria-describedby="admission-status" key={k}>
      <div id="admission-status" ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {state.status === "error" && (
          <div className="flex gap-3 rounded-(--radius-control) border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>{state.message}</p>
          </div>
        )}
      </div>

      <Field id="fullName" label="1. Full name" error={errors.fullName}>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          maxLength={120}
          defaultValue={values.fullName}
          aria-invalid={!!errors.fullName}
          aria-describedby={describedBy("fullName", { error: !!errors.fullName })}
          className={inputClasses(!!errors.fullName)}
        />
      </Field>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id="whatsapp" label="2. WhatsApp number" hint="e.g. 0300 1234567 or +966 50 123 4567" error={errors.whatsapp}>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            maxLength={30}
            defaultValue={values.whatsapp}
            aria-invalid={!!errors.whatsapp}
            aria-describedby={describedBy("whatsapp", { hint: true, error: !!errors.whatsapp })}
            className={inputClasses(!!errors.whatsapp)}
          />
        </Field>
        <Field id="email" label="3. Email address" optional error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            defaultValue={values.email}
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email", { error: !!errors.email })}
            className={inputClasses(!!errors.email)}
          />
        </Field>
      </div>

      <div className="grid gap-7 sm:grid-cols-2">
        <Field id="location" label="4. City and country" hint="e.g. Lahore, Pakistan" error={errors.location}>
          <input
            id="location"
            name="location"
            type="text"
            autoComplete="address-level2"
            required
            maxLength={120}
            defaultValue={values.location}
            aria-invalid={!!errors.location}
            aria-describedby={describedBy("location", { hint: true, error: !!errors.location })}
            className={inputClasses(!!errors.location)}
          />
        </Field>
        <Field id="course" label="5. Course" error={errors.course}>
          <div className="relative">
            <select
              id="course"
              name="course"
              defaultValue={values.course ?? courses[0]}
              aria-describedby={describedBy("course", { error: !!errors.course })}
              className={cn(inputClasses(!!errors.course), "appearance-none pr-11")}
            >
              {courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-ink-500" aria-hidden />
          </div>
        </Field>
      </div>

      <Choice name="batch" number={6} legend="Preferred batch" options={BATCHES} value={values.batch} error={errors.batch} />
      <Choice
        name="computerKnowledge"
        number={7}
        legend="Do you have basic computer knowledge?"
        options={COMPUTER_KNOWLEDGE}
        value={values.computerKnowledge}
        error={errors.computerKnowledge}
      />
      <Choice
        name="aiExperience"
        number={8}
        legend="Do you have previous experience using AI tools?"
        options={AI_EXPERIENCE}
        value={values.aiExperience}
        error={errors.aiExperience}
      />

      <Field id="message" label="9. Any questions or additional information?" optional error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={4}
          maxLength={1000}
          defaultValue={values.message}
          aria-invalid={!!errors.message}
          aria-describedby={describedBy("message", { error: !!errors.message })}
          className={cn(inputClasses(!!errors.message), "resize-y")}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive technology; bots tend to fill it. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={HONEYPOT_FIELD}>Leave this field empty</label>
        <input {...HONEYPOT_INPUT_PROPS} />
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
            aria-describedby={errors.consent ? "consent-error" : undefined}
            className="mt-1 size-5 shrink-0 rounded border-ink-300 accent-brand-600"
          />
          <label htmlFor="consent" className="text-sm leading-relaxed text-ink-700">
            I agree to AIDA storing these details to process my application and contact me on WhatsApp, as described in
            the{" "}
            <Link href="/privacy" className="font-semibold text-brand-700 underline underline-offset-2">
              privacy notice
            </Link>
            .
          </label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="mt-2 text-sm font-medium text-red-400">
            {errors.consent}
          </p>
        )}
      </div>

      <div className="rounded-(--radius-control) border border-border bg-ink-50 p-4 text-sm text-ink-600">
        Your place is confirmed only after AIDA verifies your payment. A payment screenshot on its own is not proof of
        payment.
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
