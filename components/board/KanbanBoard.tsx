"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";

import {
  cloneColumns,
  collectChangedCards,
  collectChangedColumns,
  fromCardDragId,
  fromColumnDragId,
  fromColumnDropId,
  isCardDragId,
  isColumnDragId,
  isColumnDropId,
  moveCardBetweenColumns,
  reorderColumns,
  removeCardFromColumns,
  toColumnDragId,
  toColumnDropId,
  findCardLocation,
} from "@/lib/kanban";
import { createClient } from "@/lib/supabase/client";
import type { BoardAccessRole, Card, CardDraft, ColumnWithCards } from "@/lib/types";
import { toErrorMessage, truncateText } from "@/lib/utils";

import { showAppToast } from "@/components/ui/ToastProvider";

import { CreateColumnForm } from "./CreateColumnForm";
import { EditCardDialog } from "./EditCardDialog";
import { KanbanColumn } from "./KanbanColumn";

type KanbanBoardProps = {
  accessRole: BoardAccessRole;
  boardId: string;
  initialColumns: ColumnWithCards[];
};

export function KanbanBoard({ accessRole, boardId, initialColumns }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumn, setActiveColumn] = useState<ColumnWithCards | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const canEdit = accessRole !== "viewer";

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function handleCreateColumn(title: string) {
    if (!canEdit) {
      throw new Error("This board is shared as view-only.");
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("columns")
      .insert({
        board_id: boardId,
        title,
        order_index: columns.length,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not create this column."));
    }

    setColumns((current) => [...current, { ...data, cards: [] }]);
    showAppToast({
      tone: "success",
      title: "Column created",
      description: `"${data.title}" is ready for new work items.`,
    });
  }

  async function handleCreateCard(columnId: string, values: CardDraft) {
    if (!canEdit) {
      throw new Error("This board is shared as view-only.");
    }

    const targetColumn = columns.find((column) => column.id === columnId);

    if (!targetColumn) {
      throw new Error("Column was not found.");
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("cards")
      .insert({
        board_id: boardId,
        column_id: columnId,
        title: values.title,
        description: values.description || null,
        order_index: targetColumn.cards.length,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not create this card."));
    }

    setColumns((current) =>
      current.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cards: [...column.cards, data],
            }
        : column,
      ),
    );
    showAppToast({
      tone: "success",
      title: "Card created",
      description: `"${data.title}" was added to ${targetColumn.title}.`,
    });
  }

  async function handleEditCard(cardId: string, values: CardDraft) {
    if (!canEdit) {
      throw new Error("This board is shared as view-only.");
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("cards")
      .update({
        title: values.title,
        description: values.description || null,
      })
      .eq("id", cardId)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(toErrorMessage(error, "We could not update this card."));
    }

    setColumns((current) =>
      current.map((column) => ({
        ...column,
        cards: column.cards.map((card) => (card.id === data.id ? data : card)),
      })),
    );
    setEditingCard(data);
    showAppToast({
      tone: "success",
      title: "Card updated",
      description: `"${data.title}" is saved with the latest details.`,
    });
  }

  async function handleDeleteCard(cardId: string) {
    if (!canEdit) {
      throw new Error("This board is shared as view-only.");
    }

    const snapshot = cloneColumns(columns);
    const targetCard = snapshot.flatMap((column) => column.cards).find((card) => card.id === cardId);
    const nextColumns = removeCardFromColumns(snapshot, cardId);

    if (!targetCard || !nextColumns) {
      throw new Error("Card was not found.");
    }

    setColumns(nextColumns);
    setEditingCard(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("cards").delete().eq("id", cardId);

    if (deleteError) {
      setColumns(snapshot);
      throw new Error(toErrorMessage(deleteError, "We could not delete this card."));
    }

    const changedCards = collectChangedCards(snapshot, nextColumns);

    if (changedCards.length) {
      const { error: reorderError } = await supabase.from("cards").upsert(changedCards);

      if (reorderError) {
        showAppToast({
          tone: "error",
          title: "Card deleted with sync warning",
          description: "The card was removed, but lane ordering could not be fully synced.",
        });

        return;
      }
    }

    showAppToast({
      tone: "success",
      title: "Card deleted",
      description: `"${targetCard.title}" was removed from the board.`,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    if (!canEdit) {
      return;
    }

    const activeId = String(event.active.id);

    if (isColumnDragId(activeId)) {
      const columnId = fromColumnDragId(activeId);
      const column = columns.find((item) => item.id === columnId) ?? null;

      setActiveCard(null);
      setActiveColumn(column);
      return;
    }

    if (!isCardDragId(activeId)) {
      return;
    }

    const cardId = fromCardDragId(activeId);

    for (const column of columns) {
      const card = column.cards.find((item) => item.id === cardId);

      if (card) {
        setActiveColumn(null);
        setActiveCard(card);
        break;
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) {
      setActiveCard(null);
      setActiveColumn(null);
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    setActiveCard(null);
    setActiveColumn(null);

    if (!overId) {
      return;
    }

    if (isColumnDragId(activeId)) {
      const activeColumnId = fromColumnDragId(activeId);
      let overColumnId: string | null = null;

      if (isColumnDragId(overId)) {
        overColumnId = fromColumnDragId(overId);
      } else if (isColumnDropId(overId)) {
        overColumnId = fromColumnDropId(overId);
      } else if (isCardDragId(overId)) {
        overColumnId = findCardLocation(columns, fromCardDragId(overId))?.columnId ?? null;
      }

      if (!overColumnId) {
        return;
      }

      const snapshot = cloneColumns(columns);
      const nextColumns = reorderColumns(columns, activeColumnId, overColumnId);

      if (!nextColumns) {
        return;
      }

      const changedColumns = collectChangedColumns(columns, nextColumns);

      if (!changedColumns.length) {
        return;
      }

      setColumns(nextColumns);

      const supabase = createClient();
      const { error } = await supabase.from("columns").upsert(changedColumns);

      if (error) {
        setColumns(snapshot);
        showAppToast({
          tone: "error",
          title: "Lane order not saved",
          description: toErrorMessage(
            error,
            "Lane order could not be saved. We restored the previous layout.",
          ),
        });
        return;
      }

      showAppToast({
        tone: "success",
        title: "Lane order saved",
        description: "Column positions were synced to Supabase.",
      });
      return;
    }

    if (!isCardDragId(activeId)) {
      return;
    }

    const currentCardId = fromCardDragId(activeId);
    const snapshot = cloneColumns(columns);
    const resolvedOverId = isColumnDragId(overId)
      ? toColumnDropId(fromColumnDragId(overId))
      : overId;
    const nextColumns = moveCardBetweenColumns(columns, currentCardId, resolvedOverId);

    if (!nextColumns) {
      return;
    }

    const changedCards = collectChangedCards(columns, nextColumns);

    if (!changedCards.length) {
      return;
    }

    setColumns(nextColumns);

    const supabase = createClient();
    const { error } = await supabase.from("cards").upsert(changedCards);

    if (error) {
      setColumns(snapshot);
      showAppToast({
        tone: "error",
        title: "Order not saved",
        description: toErrorMessage(
          error,
          "Card order could not be saved. We restored the previous state.",
        ),
      });
      return;
    }

    showAppToast({
      tone: "success",
      title: "Order saved",
      description: "Card positions were synced to Supabase.",
    });
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="section-kicker">Workspace</p>
            <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">Kanban board</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              {canEdit
                ? "Drag cards within a column, across columns, or reorder entire lanes. Ordering persists after refresh."
                : "This shared board is view-only. You can inspect lanes and cards, but workflow changes are disabled."}
            </p>
          </div>
          <div className="glass-badge hidden md:inline-flex">
            {canEdit ? "Touch and keyboard ready" : "View-only access"}
          </div>
        </div>

        <DndContext
          collisionDetection={closestCorners}
          id={`board-${boardId}`}
          onDragCancel={() => {
            setActiveCard(null);
            setActiveColumn(null);
          }}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <div className="workspace-shell overflow-x-auto p-4 pb-5">
            <div className="workspace-rail mb-4 flex min-w-max items-center justify-between gap-4 rounded-[24px] border border-border/72 bg-white/76 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Board flow</p>
                <p className="mt-1 text-sm text-muted-foreground">Columns behave like focused work lanes with persistent lane and card ordering.</p>
              </div>
              <div className="glass-badge">{columns.length} {columns.length === 1 ? "lane" : "lanes"}</div>
            </div>

            {columns.length ? (
              <div className="flex min-w-max gap-4">
                <SortableContext
                  items={columns.map((column) => toColumnDragId(column.id))}
                  strategy={horizontalListSortingStrategy}
                >
                  {columns.map((column) => (
                    <KanbanColumn
                      canEdit={canEdit}
                      column={column}
                      dragId={toColumnDragId(column.id)}
                      key={column.id}
                      onCardCreate={handleCreateCard}
                      onCardEdit={setEditingCard}
                    />
                  ))}
                </SortableContext>

                {canEdit ? <CreateColumnForm onCreate={handleCreateColumn} /> : null}
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.75fr)]">
                <div className="surface-panel rounded-[28px] border border-border/74 p-6">
                  <p className="section-kicker">First move</p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold text-foreground">
                    This board is empty for now
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                    {canEdit
                      ? "Start with one lane like Todo or Backlog. Once a lane exists, you can add cards, drag them across stages, and keep the order synced after every refresh."
                      : "This board does not contain lanes yet. Because you have view-only access, only the board owner or an editor can add the first lane."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {canEdit ? (
                      <>
                        <span className="glass-badge">Create your first lane</span>
                        <span className="glass-badge">Then add cards</span>
                        <span className="glass-badge">Drag from the handle</span>
                      </>
                    ) : (
                      <>
                        <span className="glass-badge">View-only board</span>
                        <span className="glass-badge">Waiting for first lane</span>
                      </>
                    )}
                  </div>
                </div>

                {canEdit ? (
                  <CreateColumnForm onCreate={handleCreateColumn} />
                ) : (
                  <div className="workspace-shell flex min-w-[20rem] flex-col justify-center gap-3 p-4">
                    <p className="section-kicker">Read only</p>
                    <p className="text-sm leading-7 text-muted-foreground">
                      Ask the board owner or an editor to create the first lane before work can be reviewed here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <article className="surface-card w-[20rem] rounded-[22px] p-4 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.4)]">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Dragging</p>
                  <h3 className="font-heading text-base font-semibold text-foreground">{activeCard.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {activeCard.description ? truncateText(activeCard.description, 120) : "Move this card to reprioritize work."}
                  </p>
                </div>
              </article>
            ) : activeColumn ? (
              <article className="surface-panel w-[21rem] rounded-[28px] border border-border/78 p-4 shadow-[0_28px_54px_-28px_rgba(15,23,42,0.32)]">
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-accent">Reordering lane</p>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-heading text-lg font-semibold text-foreground">{activeColumn.title}</h3>
                    <span className="glass-badge">{activeColumn.cards.length}</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Move this lane left or right to adjust the board flow without affecting card order inside it.
                  </p>
                </div>
              </article>
            ) : null}
          </DragOverlay>
        </DndContext>

      </div>

      <EditCardDialog
        canEdit={canEdit}
        card={editingCard}
        key={editingCard?.id ?? "closed"}
        onClose={() => setEditingCard(null)}
        onDelete={handleDeleteCard}
        onSave={handleEditCard}
        open={Boolean(editingCard)}
      />
    </>
  );
}
