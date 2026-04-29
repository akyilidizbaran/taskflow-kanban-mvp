"use client";

import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { BoardMember, BoardMemberRole } from "@/lib/types";
import { toErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { showAppToast } from "@/components/ui/ToastProvider";

type ShareBoardDialogProps = {
  boardId: string;
  boardTitle: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const selectClassName =
  "h-11 w-full rounded-2xl border border-border/85 bg-white/88 px-4 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] outline-none transition focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10";

function sortMembers(members: BoardMember[]) {
  return [...members].sort((left, right) => left.email.localeCompare(right.email));
}

export function ShareBoardDialog({
  boardId,
  boardTitle,
  onOpenChange,
  open,
}: ShareBoardDialogProps) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BoardMemberRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    async function loadMembers() {
      setIsLoadingMembers(true);
      setError(null);

      const supabase = createClient();
      const { data, error: membersError } = await supabase.rpc("list_board_members", {
        target_board_id: boardId,
      });

      if (!isActive) {
        return;
      }

      if (membersError) {
        setError(toErrorMessage(membersError, "We could not load board members."));
        setIsLoadingMembers(false);
        return;
      }

      setMembers(sortMembers(data ?? []));
      setIsLoadingMembers(false);
    }

    void loadMembers();

    return () => {
      isActive = false;
    };
  }, [boardId, open]);

  const memberCountLabel = useMemo(
    () => `${members.length} ${members.length === 1 ? "shared member" : "shared members"}`,
    [members.length],
  );

  function handleClose() {
    if (isSharing || Boolean(updatingUserId)) {
      return;
    }

    setEmail("");
    setRole("viewer");
    setError(null);
    onOpenChange(false);
  }

  async function handleShare(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Enter the email address of an existing TaskFlow user.");
      return;
    }

    setIsSharing(true);
    setError(null);

    const supabase = createClient();
    const { data, error: shareError } = await supabase
      .rpc("share_board_with_email", {
        target_board_id: boardId,
        target_email: email.trim(),
        target_role: role,
      })
      .single();

    if (shareError || !data) {
      setError(toErrorMessage(shareError, "We could not share this board."));
      setIsSharing(false);
      return;
    }

    setMembers((current) =>
      sortMembers([
        ...current.filter((member) => member.user_id !== data.user_id),
        data,
      ]),
    );
    setEmail("");
    setRole("viewer");
    setIsSharing(false);
    showAppToast({
      tone: "success",
      title: "Board shared",
      description: `${data.email} now has ${data.role} access to ${boardTitle}.`,
    });
  }

  async function handleRoleChange(member: BoardMember, nextRole: BoardMemberRole) {
    if (member.role === nextRole) {
      return;
    }

    setUpdatingUserId(member.user_id);
    setError(null);

    const supabase = createClient();
    const { data, error: updateError } = await supabase
      .rpc("update_board_member_role", {
        target_board_id: boardId,
        target_user_id: member.user_id,
        target_role: nextRole,
      })
      .single();

    if (updateError || !data) {
      setError(toErrorMessage(updateError, "We could not update this member role."));
      setUpdatingUserId(null);
      return;
    }

    setMembers((current) =>
      sortMembers(
        current.map((currentMember) =>
          currentMember.user_id === data.user_id ? data : currentMember,
        ),
      ),
    );
    setUpdatingUserId(null);
    showAppToast({
      tone: "success",
      title: "Access updated",
      description: `${data.email} now has ${data.role} access.`,
    });
  }

  async function handleRemove(member: BoardMember) {
    const shouldRemove = window.confirm(
      `Remove ${member.email} from "${boardTitle}"?`,
    );

    if (!shouldRemove) {
      return;
    }

    setUpdatingUserId(member.user_id);
    setError(null);

    const supabase = createClient();
    const { error: removeError } = await supabase.rpc("remove_board_member", {
      target_board_id: boardId,
      target_user_id: member.user_id,
    });

    if (removeError) {
      setError(toErrorMessage(removeError, "We could not remove this member."));
      setUpdatingUserId(null);
      return;
    }

    setMembers((current) => current.filter((currentMember) => currentMember.user_id !== member.user_id));
    setUpdatingUserId(null);
    showAppToast({
      tone: "success",
      title: "Access removed",
      description: `${member.email} no longer has access to ${boardTitle}.`,
    });
  }

  return (
    <Modal
      className="max-w-2xl"
      description="Share this board with existing TaskFlow users by email. Editors can change cards and lanes. Viewers can only inspect the board."
      onClose={handleClose}
      open={open}
      title={`Share ${boardTitle}`}
    >
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleShare}>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_auto] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="share-board-email">
                Existing user email
              </label>
              <Input
                autoFocus
                id="share-board-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teammate@example.com"
                type="email"
                value={email}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="share-board-role">
                Access
              </label>
              <select
                className={selectClassName}
                id="share-board-role"
                onChange={(event) => setRole(event.target.value as BoardMemberRole)}
                value={role}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            <Button loading={isSharing} type="submit">
              Share board
            </Button>
          </div>

          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Only users who already have a TaskFlow account can be added right now.
          </p>
        </form>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Current access</p>
              <p className="text-sm text-muted-foreground">{memberCountLabel}</p>
            </div>
          </div>

          {isLoadingMembers ? (
            <div className="rounded-[24px] border border-border/72 bg-surface-muted/50 px-4 py-5 text-sm text-muted-foreground">
              Loading shared members...
            </div>
          ) : members.length ? (
            <div className="space-y-3">
              {members.map((member) => {
                const isUpdating = updatingUserId === member.user_id;

                return (
                  <div
                    className="flex flex-col gap-3 rounded-[24px] border border-border/72 bg-white/82 px-4 py-4 md:flex-row md:items-center md:justify-between"
                    key={member.user_id}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {member.full_name || member.email}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <select
                        className={selectClassName}
                        disabled={isUpdating}
                        onChange={(event) =>
                          void handleRoleChange(member, event.target.value as BoardMemberRole)
                        }
                        value={member.role}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <Button
                        loading={isUpdating}
                        onClick={() => void handleRemove(member)}
                        type="button"
                        variant="ghost"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-border bg-white/72 px-4 py-5 text-sm leading-6 text-muted-foreground">
              This board is private for now. Share it with an existing TaskFlow user to let them view or edit the workflow.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
