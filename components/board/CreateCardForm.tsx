"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import type { CardDraft } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type CreateCardFormProps = {
  onCreate: (values: CardDraft) => Promise<void>;
};

export function CreateCardForm({ onCreate }: CreateCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<CardDraft>({
    title: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty = Boolean(values.title.trim() || values.description.trim());
  const confirmDiscard = useUnsavedChangesGuard(
    isOpen && isDirty,
    "You have an unfinished card draft. Close without saving?",
  );

  function handleClose() {
    if (isSubmitting || !confirmDiscard()) {
      return;
    }

    setValues({ title: "", description: "" });
    setError(null);
    setIsOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      setError("Card title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        title: values.title.trim(),
        description: values.description.trim(),
      });
      setValues({ title: "", description: "" });
      setIsOpen(false);
    } catch (createError) {
      setError(toErrorMessage(createError, "We could not create this card."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        className="justify-start rounded-[22px] border border-dashed border-border bg-white/64 text-muted-foreground hover:bg-white/82"
        fullWidth
        leadingIcon={<Plus className="size-4" />}
        onClick={() => setIsOpen(true)}
        variant="ghost"
      >
        Add card
      </Button>
    );
  }

  return (
    <form className="rounded-[24px] border border-border/80 bg-white/86 p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.18)]" onSubmit={handleSubmit}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Add card</p>
          <p className="text-xs text-muted-foreground">Keep cards brief, scannable, and easy to reprioritize.</p>
        </div>
        <button
          aria-label="Close add card form"
          className="rounded-full p-1 text-muted-foreground transition hover:bg-surface-muted hover:text-foreground"
          onClick={handleClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3">
        <Input
          autoFocus
          maxLength={120}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Card title"
          value={values.title}
        />
        <Textarea
          className="min-h-24"
          maxLength={280}
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
          placeholder="Description (optional)"
          value={values.description}
        />
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <div className="mt-4 flex gap-3">
        <Button className="flex-1" loading={isSubmitting} type="submit">
          Save card
        </Button>
        <Button
          className="flex-1"
          onClick={handleClose}
          type="button"
          variant="secondary"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
