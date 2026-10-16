-- ==============================================================================
-- List Guard: Supabase Database Schema
-- Run this script in the Supabase SQL Editor to provision all tables & policies.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Usage & Subscription Tracking
CREATE TABLE IF NOT EXISTS public.user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'lifetime')),
    scans_this_month INT NOT NULL DEFAULT 0,
    products_scanned_total INT NOT NULL DEFAULT 0,
    email_alerts BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_scan_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    slack_webhook TEXT,
    paddle_subscription_id TEXT,
    paddle_customer_id TEXT,
    subscription_status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_usage_user_id_unique UNIQUE (user_id)
);

-- 3. Scan History (Metadata only — zero product storage policy)
CREATE TABLE IF NOT EXISTS public.scan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    compliance_score INT NOT NULL,
    issues_found INT NOT NULL DEFAULT 0,
    critical_count INT NOT NULL DEFAULT 0,
    warning_count INT NOT NULL DEFAULT 0,
    info_count INT NOT NULL DEFAULT 0,
    total_products INT NOT NULL DEFAULT 0,
    regions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

-- 4. Shopify Store Connections
CREATE TABLE IF NOT EXISTS public.shopify_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_domain TEXT NOT NULL,
    access_token TEXT NOT NULL,
    scopes TEXT DEFAULT 'read_products,write_products,read_shipping',
    realtime_active BOOLEAN NOT NULL DEFAULT FALSE,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT shopify_connections_user_id_unique UNIQUE (user_id)
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_user_id_created ON public.scan_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_expires_at ON public.scan_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_shopify_connections_shop_domain ON public.shopify_connections(shop_domain);

-- 6. Row Level Security (RLS)
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

-- User Usage Policies
CREATE POLICY "Users can view own usage"
    ON public.user_usage FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage preferences"
    ON public.user_usage FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Scan History Policies
CREATE POLICY "Users can view own scan history"
    ON public.scan_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan records"
    ON public.scan_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan records"
    ON public.scan_history FOR DELETE
    USING (auth.uid() = user_id);

-- Shopify Connections Policies
CREATE POLICY "Users can view own connection"
    ON public.shopify_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connection"
    ON public.shopify_connections FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Trigger to automatically provision user_usage row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_usage (user_id, plan)
    VALUES (NEW.id, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
