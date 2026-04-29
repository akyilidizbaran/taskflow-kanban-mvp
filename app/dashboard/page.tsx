import { redirect } from "next/navigation";

import { DashboardView } from "@/components/board/DashboardView";
import { createClient } from "@/lib/supabase/server";
import type { BoardAccessRole, BoardSummary, BoardRow } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: boards, error } = await supabase
    .from("boards")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: memberships, error: membershipsError } = await supabase
    .from("board_members")
    .select("board_id, role")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const membershipByBoard = new Map(
    (memberships ?? []).map((membership) => [
      membership.board_id,
      membership.role,
    ]),
  );

  const accessibleBoards: BoardSummary[] = (boards ?? []).map((board: BoardRow) => ({
    ...board,
    access_role:
      board.owner_id === user.id
        ? "owner"
        : ((membershipByBoard.get(board.id) ?? "viewer") as BoardAccessRole),
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <DashboardView initialBoards={accessibleBoards} userEmail={user.email ?? "Unknown email"} userId={user.id} />
    </main>
  );
}
