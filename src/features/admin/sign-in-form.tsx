"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, inputClasses } from "@/components/ui/form";
import { signIn, type SignInState } from "./auth-actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      <div aria-live="polite">
        {state.error && (
          <div className="flex gap-3 rounded-(--radius-control) border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
            <AlertCircle className="mt-0.5 size-4.5 shrink-0" aria-hidden />
            <p>{state.error}</p>
          </div>
        )}
      </div>
      <Field id="email" label="Email address">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={inputClasses(!!state.error)}
        />
      </Field>
      <Field id="password" label="Password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses(!!state.error)}
        />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
