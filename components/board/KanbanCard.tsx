"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import type { Card } from "@/lib/types";
import { cn, truncateText } from "@/lib/utils";

type KanbanCardProps = {
  canEdit: boolean;
  card: Card;
  id: string;
  onEdit: (card: Card) => void;
};

export function KanbanCard({ canEdit, card, id, onEdit }: KanbanCardProps) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({
    id,
    disabled: !canEdit,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      className={cn(
        "surface-card cursor-pointer rounded-[24px] border border-border/75 p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/16 hover:shadow-[0_24px_48px_-36px_rgba(15,23,42,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDragging && "scale-[1.02] opacity-75 shadow-[0_24px_52px_-26px_rgba(15,23,42,0.35)]",
      )}
      onClick={() => onEdit(card)}
      onKeyDown={(event) => {
        if (event.currentTarget !== event.target) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onEdit(card);
        }
      }}
      ref={setNodeRef}
      role="button"
      style={style}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        {canEdit ? (
          <button
            aria-label={`Drag ${card.title}`}
            className="mt-0.5 rounded-full border border-border bg-surface-muted p-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-base font-semibold text-foreground">{card.title}</h3>
            <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Work item
            </span>
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {card.description ? truncateText(card.description, 130) : "Open the card to add notes, details, or a longer brief."}
          </p>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {canEdit ? "Tap to edit" : "Tap to view"}
            </span>
            <span className="text-xs text-muted-foreground">
              {canEdit ? "Press space on handle to drag" : "Read-only access"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
