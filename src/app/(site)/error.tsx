"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/primitives";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center py-28 text-center sm:py-36">
      <h1 className="text-3xl font-bold text-ink-950">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted">An unexpected error occurred. Please try again.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-500">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => retry()}>Try again</Button>
        <ButtonLink href="/" variant="secondary">
          Go to homepage
        </ButtonLink>
      </div>
    </Container>
  );
}
