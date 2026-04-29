import { describe, expect, it } from "vitest";

import {
  buildBoardState,
  collectChangedCards,
  collectChangedColumns,
  moveCardBetweenColumns,
  reorderColumns,
  removeCardFromColumns,
  toCardDragId,
  toColumnDropId,
} from "@/lib/kanban";
import type { CardRow, ColumnRow } from "@/lib/types";

const columns: ColumnRow[] = [
  {
    id: "column-a",
    board_id: "board-1",
    title: "Todo",
    order_index: 0,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
  },
  {
    id: "column-b",
    board_id: "board-1",
    title: "Doing",
    order_index: 1,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
  },
];

const cards: CardRow[] = [
  {
    id: "card-1",
    board_id: "board-1",
    column_id: "column-a",
    title: "Write copy",
    description: null,
    order_index: 0,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
  },
  {
    id: "card-2",
    board_id: "board-1",
    column_id: "column-a",
    title: "Review QA",
    description: null,
    order_index: 1,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
  },
  {
    id: "card-3",
    board_id: "board-1",
    column_id: "column-b",
    title: "Ship build",
    description: null,
    order_index: 0,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
  },
];

describe("kanban helpers", () => {
  it("groups cards by column and keeps ordering", () => {
    const state = buildBoardState(columns, cards);

    expect(state[0].cards.map((card) => card.id)).toEqual(["card-1", "card-2"]);
    expect(state[1].cards.map((card) => card.id)).toEqual(["card-3"]);
  });

  it("reorders cards inside the same column", () => {
    const state = buildBoardState(columns, cards);
    const next = moveCardBetweenColumns(state, "card-2", toCardDragId("card-1"));

    expect(next?.[0].cards.map((card) => `${card.id}:${card.order_index}`)).toEqual([
      "card-2:0",
      "card-1:1",
    ]);
  });

  it("moves a card to another column and reindexes both lanes", () => {
    const state = buildBoardState(columns, cards);
    const next = moveCardBetweenColumns(state, "card-1", toColumnDropId("column-b"));

    expect(next?.[0].cards.map((card) => `${card.id}:${card.order_index}`)).toEqual(["card-2:0"]);
    expect(next?.[1].cards.map((card) => `${card.id}:${card.column_id}:${card.order_index}`)).toEqual([
      "card-3:column-b:0",
      "card-1:column-b:1",
    ]);
  });

  it("returns only changed cards for persistence", () => {
    const previous = buildBoardState(columns, cards);
    const next = moveCardBetweenColumns(previous, "card-1", toColumnDropId("column-b"));
    const changed = collectChangedCards(previous, next ?? previous);

    expect(changed).toHaveLength(2);
    expect(changed.map((card) => card.id).sort()).toEqual(["card-1", "card-2"]);
  });

  it("removes a card and reindexes the remaining lane items", () => {
    const state = buildBoardState(columns, cards);
    const next = removeCardFromColumns(state, "card-1");

    expect(next?.[0].cards.map((card) => `${card.id}:${card.order_index}`)).toEqual(["card-2:0"]);
    expect(next?.[1].cards.map((card) => `${card.id}:${card.order_index}`)).toEqual(["card-3:0"]);
  });

  it("reorders columns and recalculates lane order indexes", () => {
    const state = buildBoardState(columns, cards);
    const next = reorderColumns(state, "column-b", "column-a");

    expect(next?.map((column) => `${column.id}:${column.order_index}`)).toEqual([
      "column-b:0",
      "column-a:1",
    ]);
  });

  it("returns only changed columns for persistence", () => {
    const previous = buildBoardState(columns, cards);
    const next = reorderColumns(previous, "column-b", "column-a");
    const changed = collectChangedColumns(previous, next ?? previous);

    expect(changed).toHaveLength(2);
    expect(changed.map((column) => column.id).sort()).toEqual(["column-a", "column-b"]);
  });
});
