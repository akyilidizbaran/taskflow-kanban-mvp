import Link from "next/link";
import { ArrowRight, PencilLine, Trash2 } from "lucide-react";

import type { BoardSummary } from "@/lib/types";
import { truncateText } from "@/lib/utils";

import { Button } from "@/components/ui/Button";

type BoardCardProps = {
  board: BoardSummary;
  canManage?: boolean;
  onDelete?: (board: BoardSummary) => void;
  onEdit?: (board: BoardSummary) => void;
};

export function BoardCard({ board, canManage = false, onDelete, onEdit }: BoardCardProps) {
  const roleLabel =
    board.access_role === "owner"
      ? "Owner"
      : board.access_role === "editor"
        ? "Can edit"
        : "View only";

  return (
    <article className="surface-card group flex h-full flex-col justify-between rounded-[30px] border border-border/75 p-5 hover:-translate-y-1 hover:border-primary/18 hover:shadow-[0_28px_54px_-36px_rgba(15,23,42,0.28)]">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="section-kicker">{canManage ? "Owned board" : "Shared board"}</p>
            <h3 className="font-heading text-xl font-semibold text-foreground">{board.title}</h3>
            <p className="text-xs text-muted-foreground">
              Updated {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(board.updated_at))}
            </p>
          </div>

          {canManage && onEdit && onDelete ? (
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-surface-muted/70 p-1">
              <Button
                aria-label={`Edit ${board.title}`}
                className="px-3"
                onClick={() => onEdit(board)}
                size="sm"
                variant="ghost"
              >
                <PencilLine className="size-4" />
              </Button>
              <Button
                aria-label={`Delete ${board.title}`}
                className="px-3 text-danger hover:bg-danger/10"
                onClick={() => onDelete(board)}
                size="sm"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>

        <p className="min-h-16 text-sm leading-7 text-muted-foreground">
          {board.description ? truncateText(board.description, 120) : "No description yet. Open the board to start structuring work."}
        </p>
      </div>

      <div className="soft-divider mt-6 flex items-center justify-between pt-4">
        <span className="glass-badge">{roleLabel}</span>
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition group-hover:text-accent"
          href={`/boards/${board.id}`}
        >
          Open board
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
