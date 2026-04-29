"use client";

import { useState } from "react";

import type { BoardDraft } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

type CreateBoardDialogProps = {
  open: boolean;
  mode?: "create" | "edit";
  initialValues?: BoardDraft;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BoardDraft) => Promise<void>;
};

const defaultValues: BoardDraft = {
  title: "",
  description: "",
};

export function CreateBoardDialog({
  initialValues,
  mode = "create",
  onOpenChange,
  onSubmit,
  open,
}: CreateBoardDialogProps) {
  const initialTitle = initialValues?.title ?? defaultValues.title;
  const initialDescription = initialValues?.description ?? defaultValues.description;
  const resolvedInitialValues = {
    title: initialTitle,
    description: initialDescription,
  };
  const [values, setValues] = useState<BoardDraft>(resolvedInitialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDirty =
    values.title !== resolvedInitialValues.title ||
    values.description !== resolvedInitialValues.description;
  const confirmDiscard = useUnsavedChangesGuard(
    open && isDirty,
    "You have unsaved board changes. Close without saving?",
  );

  function handleClose() {
    if (isSubmitting || !confirmDiscard()) {
      return;
    }

    setValues(resolvedInitialValues);
    setError(null);
    onOpenChange(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.title.trim()) {
      setError("Board title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
      });
      setValues(defaultValues);
      onOpenChange(false);
    } catch (submitError) {
      setError(toErrorMessage(submitError, "We could not save your board."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      description={
        mode === "create"
          ? "Name the board and add an optional description."
          : "Update the board details shown to the owner."
      }
      onClose={handleClose}
      open={open}
      title={mode === "create" ? "Create a new board" : "Edit board details"}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="board-title">
            Title
          </label>
          <Input
            autoFocus
            id="board-title"
            maxLength={100}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            placeholder="Website launch"
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="board-description">
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id="board-description"
            maxLength={280}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="A lightweight board for launch prep and QA tracking."
            value={values.description}
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={handleClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button loading={isSubmitting} type="submit">
            {mode === "create" ? "Create board" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
