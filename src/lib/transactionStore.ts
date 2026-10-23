import fs from "fs";
import path from "path";

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packId: string;
  packName: string;
  amount: number; // in USD or NGN
  currency: string; // "USD" | "NGN"
  creditsAdded: number;
  paymentProvider: "korapay" | "flutterwave" | "stripe" | "sandbox" | "admin_grant";
  status: "succeeded" | "pending" | "failed";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  flwTransactionId?: string;
  flwTxRef?: string;
  koraReference?: string;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const TRANSACTIONS_FILE = path.join(DATA_DIR, "transactions.json");

function ensureTransactionsFile(): Transaction[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(TRANSACTIONS_FILE)) {
    // Seed initial demonstration transaction for Alex
    const initialTxns: Transaction[] = [
      {
        id: "txn_init_demo_01",
        userId: "usr_alex_02",
        userEmail: "alex@creator.tv",
        userName: "Alex Streamer",
        packId: "pack_starter",
        packName: "Starter Creator Pack",
        amount: 9.0,
        currency: "USD",
        creditsAdded: 1500,
        paymentProvider: "stripe",
        status: "succeeded",
        stripeSessionId: "cs_test_sample_starter_01",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
    ];
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(initialTxns, null, 2), "utf-8");
    return initialTxns;
  }

  try {
    const raw = fs.readFileSync(TRANSACTIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read transactions.json, resetting:", err);
    return [];
  }
}

function saveTransactions(transactions: Transaction[]) {
  try {
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write transactions.json:", err);
  }
}

export const transactionStore = {
  getAll(): Transaction[] {
    return ensureTransactionsFile().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getByUserId(userId: string): Transaction[] {
    return this.getAll().filter((t) => t.userId === userId);
  },

  getById(id: string): Transaction | null {
    const txns = ensureTransactionsFile();
    return txns.find((t) => t.id === id) || null;
  },

  getByStripeSessionId(sessionId: string): Transaction | null {
    const txns = ensureTransactionsFile();
    return txns.find((t) => t.stripeSessionId === sessionId) || null;
  },

  getByFlwTxRef(txRef: string): Transaction | null {
    const txns = ensureTransactionsFile();
    return txns.find((t) => t.flwTxRef === txRef) || null;
  },

  getByKoraReference(ref: string): Transaction | null {
    const txns = ensureTransactionsFile();
    return txns.find((t) => t.koraReference === ref) || null;
  },

  getByReference(ref: string): Transaction | null {
    const txns = ensureTransactionsFile();
    return txns.find((t) => t.koraReference === ref || t.flwTxRef === ref) || null;
  },

  create(
    data: Omit<Transaction, "id" | "createdAt">
  ): Transaction {
    const txns = ensureTransactionsFile();
    const newTxn: Transaction = {
      ...data,
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    txns.unshift(newTxn);
    saveTransactions(txns);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.createTransaction(newTxn).catch((err: unknown) => {
          console.error("[Supabase Sync Error] createTransaction:", err);
        });
      }
    } catch {}

    return newTxn;
  },

  updateStatus(
    id: string,
    status: "succeeded" | "pending" | "failed",
    extra?: Partial<Transaction>
  ): Transaction | null {
    const txns = ensureTransactionsFile();
    const idx = txns.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    txns[idx] = {
      ...txns[idx],
      ...extra,
      status,
    };
    saveTransactions(txns);

    try {
      const { supabaseDb } = require("./supabaseDb");
      if (supabaseDb.isConfigured()) {
        supabaseDb.updateTransactionStatus(id, status, extra).catch((err: unknown) => {
          console.error("[Supabase Sync Error] updateTransactionStatus:", err);
        });
      }
    } catch {}

    return txns[idx];
  },

  getMetrics() {
    const all = ensureTransactionsFile();
    const succeeded = all.filter((t) => t.status === "succeeded");

    const totalGrossRevenue = succeeded.reduce((sum, t) => sum + t.amount, 0);
    const totalCreditsIssued = succeeded.reduce((sum, t) => sum + t.creditsAdded, 0);
    const totalOrders = succeeded.length;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const revenue24h = succeeded
      .filter((t) => new Date(t.createdAt).getTime() >= oneDayAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalGrossRevenue,
      totalOrders,
      totalCreditsIssued,
      revenue24h,
      averageOrderValue: totalOrders > 0 ? Number((totalGrossRevenue / totalOrders).toFixed(2)) : 0,
    };
  },
};
