/**
 * Enterprise Supabase Database Layer
 *
 * Provides typed database access for Users, Wallets, and Transactions
 * against public.users and public.transactions in PostgreSQL.
 */

import { supabaseAdmin, isSupabaseConfigured } from "./supabase";
import { User, SafeUser } from "./userStore";
import { Transaction } from "./transactionStore";

export interface DbUserRow {
  id: string;
  email: string;
  name: string;
  password: string; // password hash
  role: "admin" | "user";
  credit_balance: number;
  total_seconds_streamed: number;
  created_at: string;
  updated_at: string;
}

export interface DbTransactionRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  pack_id: string;
  pack_name: string;
  amount: number;
  currency: string;
  credits_added: number;
  payment_provider: "flutterwave" | "stripe" | "sandbox" | "admin_grant";
  status: "succeeded" | "pending" | "failed";
  flw_transaction_id?: string | null;
  flw_tx_ref?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at: string;
}

function mapRowToUser(row: DbUserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password,
    role: row.role,
    creditBalance: Number(row.credit_balance),
    totalSecondsStreamed: Number(row.total_seconds_streamed),
    createdAt: row.created_at,
  };
}

function mapRowToTransaction(row: DbTransactionRow): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    packId: row.pack_id,
    packName: row.pack_name,
    amount: Number(row.amount),
    currency: row.currency,
    creditsAdded: Number(row.credits_added),
    paymentProvider: row.payment_provider,
    status: row.status,
    flwTransactionId: row.flw_transaction_id || undefined,
    flwTxRef: row.flw_tx_ref || undefined,
    stripeSessionId: row.stripe_session_id || undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
    createdAt: row.created_at,
  };
}

export const supabaseDb = {
  isConfigured(): boolean {
    return isSupabaseConfigured && Boolean(supabaseAdmin);
  },

  /**
   * Health check to test PostgreSQL connection
   */
  async checkConnection(): Promise<{ ok: boolean; message?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) {
      return { ok: false, message: "Supabase credentials are not configured in .env.local" };
    }
    try {
      const { error } = await supabaseAdmin.from("users").select("count", { count: "exact", head: true });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      return { ok: false, message: msg };
    }
  },

  // ===================== USER METHODS =====================

  async getUserById(id: string): Promise<User | null> {
    if (!this.isConfigured() || !supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToUser(data as DbUserRow);
  },

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.isConfigured() || !supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToUser(data as DbUserRow);
  },

  async getAllUsers(): Promise<SafeUser[]> {
    if (!this.isConfigured() || !supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, credit_balance, total_seconds_streamed, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      creditBalance: Number(row.credit_balance),
      totalSecondsStreamed: Number(row.total_seconds_streamed),
      createdAt: row.created_at,
    }));
  },

  async createUser(user: User): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const { error } = await supabaseAdmin.from("users").insert({
      id: user.id,
      email: user.email.toLowerCase(),
      name: user.name,
      password: user.passwordHash,
      role: user.role,
      credit_balance: user.creditBalance,
      total_seconds_streamed: user.totalSecondsStreamed,
      created_at: user.createdAt,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async updateCredits(userId: string, delta: number): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const user = await this.getUserById(userId);
    if (!user) return { success: false, error: "User not found" };

    const targetBalance = Math.max(0, user.creditBalance + delta);

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ credit_balance: targetBalance, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("credit_balance")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, newBalance: Number(data.credit_balance) };
  },

  async setCredits(userId: string, newBalance: number): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const target = Math.max(0, newBalance);
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ credit_balance: target, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("credit_balance")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, newBalance: Number(data.credit_balance) };
  },

  async updateRole(userId: string, newRole: "admin" | "user"): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const { error } = await supabaseAdmin
      .from("users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async recordStreamTime(userId: string, seconds: number): Promise<void> {
    if (!this.isConfigured() || !supabaseAdmin) return;
    const user = await this.getUserById(userId);
    if (!user) return;

    await supabaseAdmin
      .from("users")
      .update({
        total_seconds_streamed: user.totalSecondsStreamed + seconds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  },

  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };
    const { error } = await supabaseAdmin.from("users").delete().eq("id", userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  // ===================== TRANSACTION METHODS =====================

  async createTransaction(txn: Transaction): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const { error } = await supabaseAdmin.from("transactions").insert({
      id: txn.id,
      user_id: txn.userId,
      user_email: txn.userEmail,
      user_name: txn.userName,
      pack_id: txn.packId,
      pack_name: txn.packName,
      amount: txn.amount,
      currency: txn.currency,
      credits_added: txn.creditsAdded,
      payment_provider: txn.paymentProvider,
      status: txn.status,
      flw_transaction_id: txn.flwTransactionId || null,
      flw_tx_ref: txn.flwTxRef || null,
      stripe_session_id: txn.stripeSessionId || null,
      stripe_payment_intent_id: txn.stripePaymentIntentId || null,
      created_at: txn.createdAt,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async updateTransactionStatus(
    id: string,
    status: "succeeded" | "pending" | "failed",
    extra?: Partial<Transaction>
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured() || !supabaseAdmin) return { success: false, error: "Supabase not configured" };

    const updatePayload: Record<string, unknown> = { status };
    if (extra?.flwTransactionId) updatePayload.flw_transaction_id = extra.flwTransactionId;
    if (extra?.flwTxRef) updatePayload.flw_tx_ref = extra.flwTxRef;
    if (extra?.stripeSessionId) updatePayload.stripe_session_id = extra.stripeSessionId;
    if (extra?.stripePaymentIntentId) updatePayload.stripe_payment_intent_id = extra.stripePaymentIntentId;

    const { error } = await supabaseAdmin.from("transactions").update(updatePayload).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async getAllTransactions(): Promise<Transaction[]> {
    if (!this.isConfigured() || !supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as DbTransactionRow[]).map(mapRowToTransaction);
  },

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    if (!this.isConfigured() || !supabaseAdmin) return [];
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as DbTransactionRow[]).map(mapRowToTransaction);
  },

  async getTransactionByFlwTxRef(txRef: string): Promise<Transaction | null> {
    if (!this.isConfigured() || !supabaseAdmin) return null;
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("flw_tx_ref", txRef)
      .maybeSingle();

    if (error || !data) return null;
    return mapRowToTransaction(data as DbTransactionRow);
  },
};
