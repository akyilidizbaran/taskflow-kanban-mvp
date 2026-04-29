import type { Card, CardRow, ColumnRow, ColumnWithCards } from "@/lib/types";

const CARD_PREFIX = "card:";
const COLUMN_DROP_PREFIX = "column-drop:";
const COLUMN_DRAG_PREFIX = "lane:";

type CardLocation = {
  columnId: string;
  index: number;
  card: Card;
};

function arrayMove<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

export function toCardDragId(cardId: string) {
  return `${CARD_PREFIX}${cardId}`;
}

export function toColumnDropId(columnId: string) {
  return `${COLUMN_DROP_PREFIX}${columnId}`;
}

export function toColumnDragId(columnId: string) {
  return `${COLUMN_DRAG_PREFIX}${columnId}`;
}

export function fromCardDragId(value: string) {
  return value.replace(CARD_PREFIX, "");
}

export function fromColumnDropId(value: string) {
  return value.replace(COLUMN_DROP_PREFIX, "");
}

export function fromColumnDragId(value: string) {
  return value.replace(COLUMN_DRAG_PREFIX, "");
}

export function isCardDragId(value: string) {
  return value.startsWith(CARD_PREFIX);
}

export function isColumnDropId(value: string) {
  return value.startsWith(COLUMN_DROP_PREFIX);
}

export function isColumnDragId(value: string) {
  return value.startsWith(COLUMN_DRAG_PREFIX);
}

export function cloneColumns(columns: ColumnWithCards[]) {
  return columns.map((column) => ({
    ...column,
    cards: column.cards.map((card) => ({ ...card })),
  }));
}

export function buildBoardState(columns: ColumnRow[], cards: CardRow[]) {
  const cardsByColumn = new Map<string, CardRow[]>();

  for (const card of cards) {
    const currentCards = cardsByColumn.get(card.column_id) ?? [];
    currentCards.push(card);
    cardsByColumn.set(card.column_id, currentCards);
  }

  return [...columns]
    .sort((left, right) => left.order_index - right.order_index)
    .map((column) => ({
      ...column,
      cards: [...(cardsByColumn.get(column.id) ?? [])].sort(
        (left, right) => left.order_index - right.order_index,
      ),
    }));
}

export function reindexCards(cards: Card[], columnId?: string) {
  return cards.map((card, index) => ({
    ...card,
    column_id: columnId ?? card.column_id,
    order_index: index,
  }));
}

export function reindexColumns(columns: ColumnWithCards[]) {
  return columns.map((column, index) => ({
    ...column,
    order_index: index,
  }));
}

export function findCardLocation(columns: ColumnWithCards[], cardId: string): CardLocation | null {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId);

    if (index >= 0) {
      return {
        columnId: column.id,
        index,
        card: column.cards[index],
      };
    }
  }

  return null;
}

export function moveCardBetweenColumns(
  columns: ColumnWithCards[],
  activeCardId: string,
  overId: string,
) {
  const source = findCardLocation(columns, activeCardId);

  if (!source) {
    return null;
  }

  const draft = cloneColumns(columns);
  const sourceColumn = draft.find((column) => column.id === source.columnId);

  if (!sourceColumn) {
    return null;
  }

  const [removedCard] = sourceColumn.cards.splice(source.index, 1);

  if (!removedCard) {
    return null;
  }

  if (isCardDragId(overId)) {
    const targetCardId = fromCardDragId(overId);
    const target = findCardLocation(draft, targetCardId);

    if (!target) {
      return null;
    }

    const targetColumn = draft.find((column) => column.id === target.columnId);

    if (!targetColumn) {
      return null;
    }

    const insertIndex =
      source.columnId === target.columnId && source.index < target.index
        ? target.index
        : target.index;

    targetColumn.cards.splice(insertIndex, 0, {
      ...removedCard,
      column_id: targetColumn.id,
    });
  } else if (isColumnDropId(overId)) {
    const targetColumnId = fromColumnDropId(overId);
    const targetColumn = draft.find((column) => column.id === targetColumnId);

    if (!targetColumn) {
      return null;
    }

    targetColumn.cards.push({
      ...removedCard,
      column_id: targetColumn.id,
    });
  } else {
    return null;
  }

  return draft.map((column) => ({
    ...column,
    cards: reindexCards(column.cards, column.id),
  }));
}

export function reorderCardsInColumn(column: ColumnWithCards, activeCardId: string, overCardId: string) {
  const activeIndex = column.cards.findIndex((card) => card.id === activeCardId);
  const overIndex = column.cards.findIndex((card) => card.id === overCardId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return column;
  }

  return {
    ...column,
    cards: reindexCards(arrayMove(column.cards, activeIndex, overIndex), column.id),
  };
}

export function reorderColumns(
  columns: ColumnWithCards[],
  activeColumnId: string,
  overColumnId: string,
) {
  const activeIndex = columns.findIndex((column) => column.id === activeColumnId);
  const overIndex = columns.findIndex((column) => column.id === overColumnId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return null;
  }

  return reindexColumns(arrayMove(cloneColumns(columns), activeIndex, overIndex));
}

export function removeCardFromColumns(columns: ColumnWithCards[], cardId: string) {
  const source = findCardLocation(columns, cardId);

  if (!source) {
    return null;
  }

  return columns.map((column) => {
    if (column.id !== source.columnId) {
      return {
        ...column,
        cards: column.cards.map((card) => ({ ...card })),
      };
    }

    const remainingCards = column.cards.filter((card) => card.id !== cardId);

    return {
      ...column,
      cards: reindexCards(remainingCards.map((card) => ({ ...card })), column.id),
    };
  });
}

export function collectChangedCards(previous: ColumnWithCards[], next: ColumnWithCards[]) {
  const previousMap = new Map(
    previous.flatMap((column) =>
      column.cards.map((card) => [card.id, { column_id: card.column_id, order_index: card.order_index }]),
    ),
  );

  return next
    .flatMap((column) => column.cards)
    .filter((card) => {
      const previousCard = previousMap.get(card.id);

      return (
        !previousCard ||
        previousCard.column_id !== card.column_id ||
        previousCard.order_index !== card.order_index
      );
    })
    .map((card) => ({
      id: card.id,
      title: card.title,
      description: card.description,
      board_id: card.board_id,
      column_id: card.column_id,
      order_index: card.order_index,
    }));
}

export function collectChangedColumns(previous: ColumnWithCards[], next: ColumnWithCards[]) {
  const previousMap = new Map(
    previous.map((column) => [column.id, { order_index: column.order_index }]),
  );

  return next
    .filter((column) => {
      const previousColumn = previousMap.get(column.id);

      return !previousColumn || previousColumn.order_index !== column.order_index;
    })
    .map((column) => ({
      id: column.id,
      board_id: column.board_id,
      title: column.title,
      order_index: column.order_index,
    }));
}
