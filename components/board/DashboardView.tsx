"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { BoardDraft, BoardSummary } from "@/lib/types";
import { toErrorMessage } from "@/lib/utils";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/Button";
import { showAppToast } from "@/components/ui/ToastProvider";

import { BoardCard } from "./BoardCard";
import { CreateBoardDialog } from "./CreateBoardDialog";

type DashboardViewProps = {
  initialBoards: BoardSummary[];
  userEmail: string;
  userId: string;
};

export function DashboardView({ initialBoards, userEmail, userId }: DashboardViewProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [selectedBoard, setSelectedBoard] = useState<BoardSummary | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const ownedBoards = boards.filter((board) => board.access_role === "owner");
  const sharedBoards = boards.filter((board) => board.access_role !== "owner");

  async function createBoard(values: BoardDraft) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("boards")
      .insert({
        owner_id: userId,
        title: values.title,
        description: values.description || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not create this board."));
    }

    setBoards((current) => [{ ...data, access_role: "owner" }, ...current]);
    setIsCreateOpen(false);
    showAppToast({
      tone: "success",
      title: "Board created",
      description: `"${data.title}" is ready for columns and cards.`,
    });
    router.push(`/boards/${data.id}`);
    router.refresh();
  }

  async function updateBoard(values: BoardDraft) {
    if (!selectedBoard) {
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("boards")
      .update({
        title: values.title,
        description: values.description || null,
      })
      .eq("id", selectedBoard.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not update this board."));
    }

    setBoards((current) =>
      current.map((board) =>
        board.id === data.id
          ? {
              ...data,
              access_role: board.access_role,
            }
          : board,
      ),
    );
    setSelectedBoard(null);
    showAppToast({
      tone: "success",
      title: "Board updated",
      description: `"${data.title}" now reflects the latest board details.`,
    });
  }

  async function deleteBoard(board: BoardSummary) {
    const shouldDelete = window.confirm(
      `Delete "${board.title}"? This also removes its columns and cards.`,
    );

    if (!shouldDelete) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("boards").delete().eq("id", board.id);

    if (error) {
      showAppToast({
        tone: "error",
        title: "Board not deleted",
        description: toErrorMessage(error, "We could not delete this board."),
      });
      return;
    }

    setBoards((current) => current.filter((currentBoard) => currentBoard.id !== board.id));
    showAppToast({
      tone: "success",
      title: "Board deleted",
      description: `"${board.title}" and its nested work items were removed.`,
    });
  }

  return (
    <>
      <section className="space-y-6">
        <header className="hero-shell surface-panel rounded-[34px] p-6 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-5">
              <p className="section-kicker">TaskFlow</p>
              <div className="space-y-2">
                <h1 className="font-heading text-4xl font-semibold text-foreground md:text-5xl">Your boards</h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Keep project work visible, move cards across columns, and preserve ordering every time the page reloads.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="metric-tile rounded-[24px] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Accessible boards</p>
                  <p className="mt-2 font-heading text-3xl font-semibold text-foreground">{boards.length}</p>
                </div>
                <div className="metric-tile rounded-[24px] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Shared access</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {sharedBoards.length ? `${sharedBoards.length} shared board${sharedBoards.length > 1 ? "s" : ""} available.` : "No shared boards yet."}
                  </p>
                </div>
                <div className="metric-tile rounded-[24px] px-4 py-4 sm:col-span-2 xl:col-span-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Operating mode</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">Owned boards, shared viewers, and shared editors in one compact workspace.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="metric-tile rounded-[28px] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Workspace access</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Signed in as <span className="font-semibold text-foreground">{userEmail}</span>
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button leadingIcon={<Plus className="size-4" />} onClick={() => setIsCreateOpen(true)}>
                    Create board
                  </Button>
                  <LogoutButton />
                </div>
              </div>

              <div className="rounded-[28px] border border-border/72 bg-surface-muted/55 px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Board list</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Keep ownership clear, then collaborate through shared editor or view-only access without leaving the same dashboard.
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-foreground">Board list</h2>
            <p className="text-sm text-muted-foreground">
              Create a fresh board, reopen an owned board, or jump into a shared workspace.
            </p>
          </div>
          <div className="glass-badge hidden md:inline-flex">Owner + shared workspace</div>
        </div>

        {boards.length ? (
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl font-semibold text-foreground">Owned boards</h3>
                  <p className="text-sm text-muted-foreground">Full control, sharing, and board-level settings.</p>
                </div>
                <span className="glass-badge">{ownedBoards.length} {ownedBoards.length === 1 ? "board" : "boards"}</span>
              </div>

              {ownedBoards.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {ownedBoards.map((board) => (
                    <BoardCard
                      board={board}
                      canManage
                      key={board.id}
                      onDelete={deleteBoard}
                      onEdit={(selected) => setSelectedBoard(selected)}
                    />
                  ))}
                </div>
              ) : (
                <div className="workspace-shell px-6 py-8 text-center">
                  <p className="font-heading text-xl font-semibold text-foreground">No owned boards yet</p>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                    Create your first board to start structuring work, sharing it, and building collaborative lanes.
                  </p>
                </div>
              )}
            </section>

            {sharedBoards.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-xl font-semibold text-foreground">Shared with you</h3>
                    <p className="text-sm text-muted-foreground">Boards where you have editor or view-only access.</p>
                  </div>
                  <span className="glass-badge">{sharedBoards.length} shared</span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sharedBoards.map((board) => (
                    <BoardCard board={board} key={board.id} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="workspace-shell px-6 py-10 text-center">
            <h3 className="font-heading text-2xl font-semibold text-foreground">No boards yet</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Create your first board to start shaping columns, cards, and a focused project workflow.
            </p>
            <p className="mx-auto mt-2 max-w-lg text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Start with one board per product stream, squad, or launch track.
            </p>
            <Button className="mt-6" leadingIcon={<Plus className="size-4" />} onClick={() => setIsCreateOpen(true)}>
              Create your first board
            </Button>
          </div>
        )}
      </section>

      <CreateBoardDialog
        key={`create-${isCreateOpen ? "open" : "closed"}`}
        onOpenChange={setIsCreateOpen}
        onSubmit={createBoard}
        open={isCreateOpen}
      />

      <CreateBoardDialog
        initialValues={
          selectedBoard
            ? {
                title: selectedBoard.title,
                description: selectedBoard.description ?? "",
              }
            : undefined
        }
        mode="edit"
        key={selectedBoard ? `edit-${selectedBoard.id}` : "edit-closed"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedBoard(null);
          }
        }}
        onSubmit={updateBoard}
        open={Boolean(selectedBoard)}
      />
    </>
  );
}
