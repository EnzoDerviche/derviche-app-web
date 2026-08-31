import type { Client, Budget, BudgetItem, Payment } from "@/types";

// Hand-authored to match supabase/migrations. Regenerate with the Supabase CLI
// (`supabase gen types typescript`) if the schema grows. Shape follows
// supabase-js GenericSchema; Relationships must be populated or embedded
// selects (e.g. `clients(*)`, `payments(amount)`) type as SelectQueryError.

/** Insert type: all columns optional except the required `Req` set. */
type Insert<Row, Req extends keyof Row> = Partial<Row> & Pick<Row, Req>;

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Insert<Client, "first_name" | "last_name">;
        Update: Partial<Client>;
        Relationships: [];
      };
      budgets: {
        Row: Budget;
        Insert: Insert<Budget, "client_id" | "status">;
        Update: Partial<Budget>;
        Relationships: [];
      };
      budget_items: {
        Row: BudgetItem;
        Insert: Insert<BudgetItem, "budget_id" | "description" | "quantity" | "unit" | "unit_price" | "subtotal">;
        Update: Partial<BudgetItem>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Insert<Payment, "budget_id" | "amount" | "payment_date" | "payment_type">;
        Update: Partial<Payment>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_budget_number: { Args: Record<string, never>; Returns: string };
      dashboard_stats: { Args: Record<string, never>; Returns: DashboardStats };
      recalc_budget_payment: { Args: { p_budget_id: string }; Returns: undefined };
      create_budget: {
        Args: {
          p_client_id: string; p_status: string;
          p_subtotal: number; p_discount: number; p_tax: number; p_total: number;
          p_notes: string | null; p_sent_at: string | null; p_accepted_at: string | null;
          p_items: unknown;
        };
        Returns: string;
      };
      update_budget: {
        Args: {
          p_id: string; p_client_id: string; p_status: string;
          p_subtotal: number; p_discount: number; p_tax: number; p_total: number;
          p_notes: string | null; p_sent_at: string | null; p_accepted_at: string | null;
          p_items: unknown;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export interface DashboardStats {
  total_clients: number;
  total_budgets: number;
  by_status: Record<string, number>;
  budgets_with_balance: number;
  total_budgeted: number;
  total_collected: number;
  total_pending: number;
}
