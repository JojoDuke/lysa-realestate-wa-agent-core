-- Lysa core capabilities: lead qualification, memory, and viewing booking
-- Run after 001_initial.sql

CREATE TABLE IF NOT EXISTS public.leads (
  phone_number TEXT PRIMARY KEY REFERENCES public.users(phone_number) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  intent TEXT,
  property_type TEXT,
  preferred_area TEXT,
  budget_min NUMERIC,
  budget_max NUMERIC,
  bedrooms INTEGER,
  timeline TEXT,
  financing TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.customer_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'preference',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customer_memories_phone_idx
  ON public.customer_memories (phone_number, created_at DESC);

CREATE TABLE IF NOT EXISTS public.viewing_requests (
  reference TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  property_id TEXT,
  property_title TEXT,
  preferred_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS viewing_requests_phone_idx
  ON public.viewing_requests (phone_number, created_at DESC);

DROP TRIGGER IF EXISTS viewing_requests_updated_at ON public.viewing_requests;
CREATE TRIGGER viewing_requests_updated_at
  BEFORE UPDATE ON public.viewing_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
