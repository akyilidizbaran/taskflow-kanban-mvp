export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "boards_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      board_members: {
        Row: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor";
          added_by: string;
          created_at: string;
        };
        Insert: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor";
          added_by: string;
          created_at?: string;
        };
        Update: {
          board_id?: string;
          user_id?: string;
          role?: "viewer" | "editor";
          added_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "board_members_added_by_fkey";
            columns: ["added_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_members_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "board_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          title: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          title: string;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          title?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "columns_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
        ];
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          board_id: string;
          title: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          board_id: string;
          title: string;
          description?: string | null;
          order_index: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          column_id?: string;
          board_id?: string;
          title?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cards_column_id_fkey";
            columns: ["column_id"];
            isOneToOne: false;
            referencedRelation: "columns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cards_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_board_members: {
        Args: {
          target_board_id: string;
        };
        Returns: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor";
          email: string;
          full_name: string | null;
          created_at: string;
        }[];
      };
      share_board_with_email: {
        Args: {
          target_board_id: string;
          target_email: string;
          target_role: "viewer" | "editor";
        };
        Returns: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor";
          email: string;
          full_name: string | null;
          created_at: string;
        }[];
      };
      update_board_member_role: {
        Args: {
          target_board_id: string;
          target_user_id: string;
          target_role: "viewer" | "editor";
        };
        Returns: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor";
          email: string;
          full_name: string | null;
          created_at: string;
        }[];
      };
      remove_board_member: {
        Args: {
          target_board_id: string;
          target_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BoardRow = Database["public"]["Tables"]["boards"]["Row"];
export type BoardMemberRow = Database["public"]["Tables"]["board_members"]["Row"];
export type ColumnRow = Database["public"]["Tables"]["columns"]["Row"];
export type CardRow = Database["public"]["Tables"]["cards"]["Row"];

export type BoardMemberRole = BoardMemberRow["role"];
export type BoardAccessRole = "owner" | BoardMemberRole;

export type Board = Pick<BoardRow, "id" | "title" | "description">;
export type Card = CardRow;
export type Column = ColumnRow;
export type ColumnWithCards = Column & { cards: Card[] };
export type BoardSummary = BoardRow & { access_role: BoardAccessRole };
export type BoardMember = Pick<BoardMemberRow, "board_id" | "user_id" | "role" | "created_at"> & {
  email: string;
  full_name: string | null;
};

export type BoardPageData = {
  board: Board;
  columns: ColumnWithCards[];
};

export type BoardDraft = {
  title: string;
  description: string;
};

export type ColumnDraft = {
  title: string;
};

export type CardDraft = {
  title: string;
  description: string;
};

export type ReorderPayload = {
  boardId: string;
  cards: Array<
    Pick<Card, "id" | "title" | "description" | "board_id" | "column_id" | "order_index">
  >;
};

export type UiMessage = {
  type: "success" | "error";
  text: string;
} | null;
