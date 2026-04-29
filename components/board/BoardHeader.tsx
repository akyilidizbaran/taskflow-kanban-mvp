"use client";

import Link from "next/link";
import { ArrowLeft, PencilLine, Share2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Board, BoardAccessRole, BoardDraft } from "@/lib/types";
import { toErrorMessage } from "@/lib/utils";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/Button";
import { showAppToast } from "@/components/ui/ToastProvider";

import { CreateBoardDialog } from "./CreateBoardDialog";
import { ShareBoardDialog } from "./ShareBoardDialog";

type BoardHeaderProps = {
  accessRole: BoardAccessRole;
  initialBoard: Board;
  userEmail: string;
};

export function BoardHeader({ accessRole, initialBoard, userEmail }: BoardHeaderProps) {
  const router = useRouter();
  const [board, setBoard] = useState(initialBoard);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = accessRole === "owner";
  const canEditBoard = accessRole !== "viewer";

  const roleBadge =
    accessRole === "owner"
      ? "Owner"
      : accessRole === "editor"
        ? "Editor access"
        : "View only";

  async function handleBoardUpdate(values: BoardDraft) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("boards")
      .update({
        title: values.title,
        description: values.description || null,
      })
      .eq("id", board.id)
      .select("id, title, description")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not update this board."));
    }

    setBoard(data);
    setIsEditOpen(false);
    showAppToast({
      tone: "success",
      title: "Board updated",
      description: `"${data.title}" is ready with the latest board details.`,
    });
  }

  async function handleDelete() {
    const shouldDelete = window.confirm(
      "Delete this board? Columns and cards inside it will be removed as well.",
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    const supabase = createClient();
    const { error } = await supabase.from("boards").delete().eq("id", board.id);

    if (error) {
      setIsDeleting(false);
      showAppToast({
        tone: "error",
        title: "Board not deleted",
        description: toErrorMessage(error, "We could not delete this board."),
      });
      return;
    }

    showAppToast({
      tone: "success",
      title: "Board deleted",
      description: `"${board.title}" was removed. Returning to dashboard.`,
    });
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <>
      <header className="surface-panel rounded-[30px] p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-4">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"
              href="/dashboard"
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>

            <div className="space-y-2">
              <p className="section-kicker">TaskFlow board</p>
              <h1 className="font-heading text-3xl font-semibold text-foreground md:text-5xl">{board.title}</h1>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
                {board.description || "This board is ready for columns, cards, and persistent drag-and-drop ordering."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="glass-badge">{isOwner ? "Owned board" : "Shared board"}</span>
              <span className="glass-badge">{roleBadge}</span>
              <span className="glass-badge">{canEditBoard ? "Can edit workflow" : "Read-only workflow"}</span>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  leadingIcon={<Share2 className="size-4" />}
                  onClick={() => setIsShareOpen(true)}
                  variant="secondary"
                >
                  Share access
                </Button>
                <Button leadingIcon={<PencilLine className="size-4" />} onClick={() => setIsEditOpen(true)} variant="secondary">
                  Rename board
                </Button>
                <Button
                  className="text-danger hover:bg-danger/10"
                  leadingIcon={<Trash2 className="size-4" />}
                  loading={isDeleting}
                  onClick={handleDelete}
                  variant="ghost"
                >
                  Delete board
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3">
            <div className="metric-tile rounded-[28px] px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Board access</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{userEmail}</span>
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {isOwner
                  ? "You own this board and can manage sharing, board settings, and all workflow changes."
                  : canEditBoard
                    ? "This board is shared with editor access, so you can update cards and lanes but cannot manage board settings."
                    : "This board is shared with view-only access. You can inspect lanes and cards without changing the workflow."}
              </p>
              <div className="mt-5">
                <LogoutButton />
              </div>
            </div>

            <div className="rounded-[28px] border border-border/72 bg-surface-muted/52 px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Workspace note</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {isOwner
                  ? "Keep lanes lightweight. Share the board with existing TaskFlow users when you want collaborators to edit or review the workflow."
                  : canEditBoard
                    ? "Editors can reprioritize lanes and cards, but only the owner can rename, delete, or manage board sharing."
                    : "Viewers can inspect the board and open cards for context, while write actions stay reserved for the owner and editors."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <CreateBoardDialog
        initialValues={{
          title: board.title,
          description: board.description ?? "",
        }}
        key={`${board.id}-${isEditOpen ? "open" : "closed"}-${board.title}`}
        mode="edit"
        onOpenChange={setIsEditOpen}
        onSubmit={handleBoardUpdate}
        open={isEditOpen}
      />

      {isOwner ? (
        <ShareBoardDialog
          boardId={board.id}
          boardTitle={board.title}
          onOpenChange={setIsShareOpen}
          open={isShareOpen}
        />
      ) : null}
    </>
  );
}
