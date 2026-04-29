"use client";

import { useState } from "react";

import type { Card, CardDraft } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/useUnsavedChangesGuard";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

type EditCardDialogProps = {
  canEdit: boolean;
  card: Card | null;
  onClose: () => void;
  onDelete: (cardId: string) => Promise<void>;
  onSave: (cardId: string, values: CardDraft) => Promise<void>;
  open: boolean;
};

const emptyCardDraft: CardDraft = {
  title: "",
  description: "",
};

export function EditCardDialog({ canEdit, card, onClose, onDelete, onSave, open }: EditCardDialogProps) {
  const initialTitle = card?.title ?? emptyCardDraft.title;
  const initialDescription = card?.description ?? emptyCardDraft.description;
  const initialValues = {
    title: initialTitle,
    description: initialDescription,
  };
  const [values, setValues] = useState<CardDraft>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDirty =
    values.title !== initialValues.title || values.description !== initialValues.description;
  const confirmDiscard = useUnsavedChangesGuard(
    open && isDirty,
    "You have unsaved card changes. Close without saving?",
  );

  function handleClose() {
    if (isSubmitting || isDeleting || !confirmDiscard()) {
      return;
    }

    setValues(initialValues);
    setError(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!card) {
      return;
    }

    if (!values.title.trim()) {
      setError("Card title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(card.id, {
        title: values.title.trim(),
        description: values.description.trim(),
      });
      onClose();
    } catch (saveError) {
      setError(toErrorMessage(saveError, "We could not update this card."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!card) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${card.title}"? This permanently removes it from the board.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onDelete(card.id);
      onClose();
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, "We could not delete this card."));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Modal
      description={
        canEdit
          ? "Update the card title or add more context for the work item."
          : "This board is shared in view-only mode. You can inspect the card details, but editing is disabled."
      }
      onClose={handleClose}
      open={open}
      title={card ? `${canEdit ? "Edit" : "View"} ${card.title}` : "View card"}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="edit-card-title">
            Title
          </label>
          <Input
            autoFocus={canEdit}
            disabled={!canEdit}
            id="edit-card-title"
            maxLength={120}
            onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            readOnly={!canEdit}
            value={values.title}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="edit-card-description">
            Description
          </label>
          <Textarea
            disabled={!canEdit}
            id="edit-card-description"
            maxLength={400}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            readOnly={!canEdit}
            value={values.description}
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {canEdit ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button loading={isDeleting} onClick={handleDelete} type="button" variant="danger">
              Delete card
            </Button>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Button onClick={handleClose} type="button" variant="secondary">
                Cancel
              </Button>
              <Button loading={isSubmitting} type="submit">
                Save changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button onClick={handleClose} type="button" variant="secondary">
              Close
            </Button>
          </div>
        )}
      </form>
    </Modal>
  );
}
