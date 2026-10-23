import { transactionStore, Transaction } from "./transactionStore";
import { userStore } from "./userStore";
import { isKorapayConfigured, verifyTransaction as verifyKoraTransaction } from "./korapay";

/**
 * Reconciles a single transaction by querying the gateway.
 * If Korapay indicates success, fulfills credits and marks transaction succeeded.
 */
export async function reconcileTransaction(
  txn: Transaction
): Promise<{ reconciled: boolean; status: string; creditsAdded: number }> {
  if (txn.status === "succeeded") {
    return { reconciled: false, status: "succeeded", creditsAdded: 0 };
  }

  // Korapay reconciliation
  if (txn.paymentProvider === "korapay" && txn.koraReference && isKorapayConfigured) {
    try {
      const koraRes = await verifyKoraTransaction(txn.koraReference);
      const koraData = koraRes.data;

      if (koraRes.status && koraData && koraData.status === "success") {
        const expectedAmount = txn.amount;
        const expectedCurrency = txn.currency;

        if (
          Number(koraData.amount) >= expectedAmount &&
          koraData.currency === expectedCurrency
        ) {
          // Double check transaction status again to avoid race conditions
          const current = transactionStore.getById(txn.id);
          if (current && current.status === "succeeded") {
            return { reconciled: false, status: "succeeded", creditsAdded: 0 };
          }

          // 1. Credit the user
          userStore.updateCredits(txn.userId, txn.creditsAdded);

          // 2. Mark succeeded
          transactionStore.updateStatus(txn.id, "succeeded", {
            koraReference: txn.koraReference,
          });

          console.log(
            `[Reconciliation] Successfully fulfilled +${txn.creditsAdded} credits for user ${txn.userId} (${txn.userEmail}) via Korapay ref ${txn.koraReference}`
          );

          return { reconciled: true, status: "succeeded", creditsAdded: txn.creditsAdded };
        }
      } else if (koraData && koraData.status === "failed") {
        transactionStore.updateStatus(txn.id, "failed");
        return { reconciled: true, status: "failed", creditsAdded: 0 };
      } else if (!koraRes.status && koraRes.message?.toLowerCase().includes("not found")) {
        transactionStore.updateStatus(txn.id, "failed");
        return { reconciled: true, status: "failed", creditsAdded: 0 };
      }
    } catch (err) {
      console.error(`[Reconciliation] Error verifying ref ${txn.koraReference}:`, err);
    }
  }

  return { reconciled: false, status: txn.status, creditsAdded: 0 };
}

/**
 * Proactively checks and reconciles all pending transactions for a given user.
 * Runs seamlessly whenever billing history or user data is accessed.
 */
export async function reconcileUserPendingTransactions(
  userId: string
): Promise<{ reconciledCount: number; creditsAwarded: number }> {
  const userTxns = transactionStore.getByUserId(userId);
  const pendingTxns = userTxns.filter(
    (t) => t.status === "pending" && t.paymentProvider === "korapay" && Boolean(t.koraReference)
  );

  let reconciledCount = 0;
  let creditsAwarded = 0;

  for (const txn of pendingTxns) {
    const res = await reconcileTransaction(txn);
    if (res.reconciled && res.status === "succeeded") {
      reconciledCount++;
      creditsAwarded += res.creditsAdded;
    }
  }

  return { reconciledCount, creditsAwarded };
}
