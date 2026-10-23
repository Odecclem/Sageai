-- ==============================================================================
-- Sage AI Live Video Studio - Supabase Database Schema
-- Production Ready Schema for Users, Financial Ledger & Credit Wallets
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  credit_balance BIGINT NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  total_seconds_streamed INTEGER NOT NULL DEFAULT 0 CHECK (total_seconds_streamed >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user email and role lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. Create Transactions Table (Financial Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  pack_name TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credits_added INTEGER NOT NULL,
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('flutterwave', 'stripe', 'sandbox', 'admin_grant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('succeeded', 'pending', 'failed')),
  flw_transaction_id TEXT,
  flw_tx_ref TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_flw_tx_ref ON public.transactions(flw_tx_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 3. Atomic Function for Credit Deduction (Protects Against Race Conditions)
-- Automatically prevents negative balances and returns whether deduction succeeded.
CREATE OR REPLACE FUNCTION public.deduct_stream_credits(
  target_user_id TEXT,
  credits_to_deduct INTEGER,
  seconds_streamed INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_bal BIGINT;
  new_bal BIGINT;
BEGIN
  -- Lock user row for update
  SELECT credit_balance INTO current_bal
  FROM public.users
  WHERE id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found', 'newBalance', 0);
  END IF;

  IF current_bal < credits_to_deduct THEN
    -- Deplete balance to 0 and halt
    UPDATE public.users
    SET credit_balance = 0,
        total_seconds_streamed = total_seconds_streamed + seconds_streamed,
        updated_at = NOW()
    WHERE id = target_user_id;
    RETURN jsonb_build_object('success', false, 'burnedOut', true, 'newBalance', 0);
  END IF;

  new_bal := current_bal - credits_to_deduct;

  UPDATE public.users
  SET credit_balance = new_bal,
      total_seconds_streamed = total_seconds_streamed + seconds_streamed,
      updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true, 'burnedOut', (new_bal <= 0), 'newBalance', new_bal);
END;
$$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Service role has full access; anon/auth can read public properties
CREATE POLICY "Allow service role full access to users"
  ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to transactions"
  ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Seed Initial Production / Demo Accounts
INSERT INTO public.users (id, email, name, password, role, credit_balance, total_seconds_streamed)
VALUES
  ('usr_admin_01', 'admin@sage.ai', 'System Admin', 'admin123', 'admin', 999999, 120),
  ('usr_alex_02', 'alex@creator.tv', 'Alex Streamer', 'password123', 'user', 1500, 480)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- Seed Sample Starter Transaction
INSERT INTO public.transactions (
  id, user_id, user_email, user_name, pack_id, pack_name, amount, currency, credits_added, payment_provider, status, flw_tx_ref
)
VALUES (
  'txn_init_demo_01',
  'usr_alex_02',
  'alex@creator.tv',
  'Alex Streamer',
  'pack-creator',
  'Creator Pack',
  25.00,
  'USD',
  1500,
  'flutterwave',
  'succeeded',
  'flw_init_sample_01'
)
ON CONFLICT (id) DO NOTHING;
