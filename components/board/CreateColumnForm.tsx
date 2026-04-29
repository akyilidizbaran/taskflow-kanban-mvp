"use client";

import { useState } from "react";

import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type CreateColumnFormProps = {
  onCreate: (title: string) => Promise<void>;
};

export function CreateColumnForm({ onCreate }: CreateColumnFormProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Column title is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate(title.trim());
      setTitle("");
    } catch (createError) {
      setError(toErrorMessage(createError, "We could not create this column."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="workspace-shell flex min-w-[20rem] flex-col gap-4 p-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <p className="section-kicker">New column</p>
        <p className="text-sm leading-7 text-muted-foreground">
          Add a lane for the next stage in your workflow.
        </p>
        <Input
          maxLength={80}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a column title"
          value={title}
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button fullWidth loading={isSubmitting} type="submit" variant="secondary">
        Add column
      </Button>
    </form>
  );
}
