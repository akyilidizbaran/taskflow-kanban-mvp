"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";

import { toCardDragId, toColumnDropId } from "@/lib/kanban";
import type { Card, CardDraft, ColumnWithCards } from "@/lib/types";
import { cn } from "@/lib/utils";

import { CreateCardForm } from "./CreateCardForm";
import { KanbanCard } from "./KanbanCard";

type KanbanColumnProps = {
  canEdit: boolean;
  column: ColumnWithCards;
  dragId: string;
  onCardCreate: (columnId: string, values: CardDraft) => Promise<void>;
  onCardEdit: (card: Card) => void;
};

export function KanbanColumn({ canEdit, column, dragId, onCardCreate, onCardEdit }: KanbanColumnProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
  } = useSortable({
    id: dragId,
    disabled: !canEdit,
  });
  const { isOver, setNodeRef } = useDroppable({
    id: toColumnDropId(column.id),
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <section
      className={cn(
        "surface-panel flex min-h-[30rem] min-w-[21rem] max-w-[21rem] shrink-0 flex-col rounded-[30px] border border-border/75 p-4 transition-transform duration-200",
        isDragging && "scale-[1.01] shadow-[0_28px_58px_-34px_rgba(15,23,42,0.32)]",
        isOver && "border-primary/35 bg-white shadow-[0_22px_50px_-34px_rgba(29,78,216,0.32)]",
      )}
      ref={setSortableNodeRef}
      style={style}
    >
      <div className="mb-4 rounded-[24px] border border-border/70 bg-white/84 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Lane</p>
            <h2 className="font-heading text-xl font-semibold text-foreground">{column.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="glass-badge">
              {column.cards.length}
            </span>
            {canEdit ? (
              <button
                aria-label={`Reorder lane ${column.title}`}
                className="rounded-full border border-border bg-surface-muted p-2 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
                ref={setActivatorNodeRef}
                type="button"
                {...attributes}
                {...listeners}
              >
                <GripHorizontal className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {canEdit
            ? "Cards in this lane stay ordered after refresh. Drag the handle to reorder the lane itself."
            : "Cards in this lane are visible in read-only mode. Reordering and creation stay limited to editors and the owner."}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <SortableContext items={column.cards.map((card) => toCardDragId(card.id))} strategy={verticalListSortingStrategy}>
          <div className="rounded-[24px] bg-surface-muted/35 p-2">
            <div className="flex min-h-[8rem] flex-1 flex-col gap-3" ref={setNodeRef}>
              {column.cards.length ? (
                column.cards.map((card) => (
                  <KanbanCard canEdit={canEdit} card={card} id={toCardDragId(card.id)} key={card.id} onEdit={onCardEdit} />
                ))
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-white/72 px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-foreground">No cards in this lane yet</p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                    {canEdit
                      ? "Add the first card below or drop one from another lane to begin this stage."
                      : "The lane is empty right now. A board editor can add the first card for this stage."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SortableContext>

        {canEdit ? <CreateCardForm onCreate={(values) => onCardCreate(column.id, values)} /> : null}
      </div>
    </section>
  );
}
