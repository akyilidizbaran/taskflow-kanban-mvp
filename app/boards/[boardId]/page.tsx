import { notFound, redirect } from "next/navigation";

import { BoardHeader } from "@/components/board/BoardHeader";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { buildBoardState } from "@/lib/kanban";
import { createClient } from "@/lib/supabase/server";
import type { BoardAccessRole, BoardRow } from "@/lib/types";

type BoardPageProps = {
  params: Promise<{
    boardId: string;
  }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: board, error: boardError },
    { data: membership, error: membershipError },
    { data: columns, error: columnsError },
    { data: cards, error: cardsError },
  ] =
    await Promise.all([
      supabase.from("boards").select("*").eq("id", boardId).maybeSingle(),
      supabase
        .from("board_members")
        .select("role")
        .eq("board_id", boardId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("columns").select("*").eq("board_id", boardId).order("order_index", { ascending: true }),
      supabase.from("cards").select("*").eq("board_id", boardId).order("order_index", { ascending: true }),
    ]);

  if (boardError || !board) {
    notFound();
  }

  if (columnsError) {
    throw new Error(columnsError.message);
  }

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const resolvedBoard = board as BoardRow;
  const accessRole: BoardAccessRole =
    resolvedBoard.owner_id === user.id
      ? "owner"
      : ((membership?.role ?? "viewer") as BoardAccessRole);
  const boardColumns = buildBoardState(columns ?? [], cards ?? []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-6">
        <BoardHeader accessRole={accessRole} initialBoard={resolvedBoard} userEmail={user.email ?? "Unknown email"} />
        <KanbanBoard accessRole={accessRole} boardId={resolvedBoard.id} initialColumns={boardColumns} />
      </div>
    </main>
  );
}
