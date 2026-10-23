import { NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { userStore } from "@/lib/userStore";
import { transactionStore } from "@/lib/transactionStore";

export async function GET() {
  const localUsersCount = userStore.getAllUsers().length;
  const localTransactionsCount = transactionStore.getAll().length;

  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({
      status: "local_mode",
      provider: "Local File System JSON (Fallback Mode)",
      supabaseConfigured: false,
      message: "Supabase keys not yet provided in .env.local. Running securely on local database.",
      metrics: {
        localUsersCount,
        localTransactionsCount,
        supabaseConnected: false,
      },
      instructions: [
        "1. Open Supabase Dashboard at https://app.supabase.com",
        "2. Run the SQL script from 'supabase/schema.sql' in SQL Editor",
        "3. Copy your Project URL, Anon Key, and Service Role Key into .env.local",
        "4. Restart the server or hit POST /api/database/status to sync data",
      ],
    });
  }

  try {
    const [usersRes, txnsRes] = await Promise.all([
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("transactions").select("id", { count: "exact", head: true }),
    ]);

    if (usersRes.error) {
      return NextResponse.json({
        status: "error",
        supabaseConfigured: true,
        error: usersRes.error.message,
        hint: "Make sure you have run the schema.sql in your Supabase SQL Editor.",
      }, { status: 500 });
    }

    return NextResponse.json({
      status: "connected",
      provider: "Supabase PostgreSQL (Cloud Database)",
      supabaseConfigured: true,
      metrics: {
        supabaseUsersCount: usersRes.count ?? 0,
        supabaseTransactionsCount: txnsRes.count ?? 0,
        localUsersCount,
        localTransactionsCount,
        supabaseConnected: true,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database check failed";
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}

/**
 * POST /api/database/status
 * Synchronizes all local data into Supabase (Migration / Sync tool)
 */
export async function POST() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return NextResponse.json({
      success: false,
      error: "Cannot sync: Supabase is not configured in .env.local",
    }, { status: 400 });
  }

  try {
    const { supabaseDb } = await import("@/lib/supabaseDb");

    // Sync all local users
    const allLocalUsers = (await import("@/lib/userStore")).userStore.getAllUsers();
    let usersSynced = 0;
    for (const u of allLocalUsers) {
      const fullUser = (await import("@/lib/userStore")).userStore.getUserById(u.id);
      if (fullUser) {
        await supabaseDb.createUser(fullUser);
        usersSynced++;
      }
    }

    // Sync all local transactions
    const allLocalTxns = transactionStore.getAll();
    let txnsSynced = 0;
    for (const t of allLocalTxns) {
      await supabaseDb.createTransaction(t);
      txnsSynced++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${usersSynced} users and ${txnsSynced} transactions to Supabase!`,
      usersSynced,
      txnsSynced,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
