-- ═══════════════════════════════════════════════════
-- 1. Drop medif_records table (safely)
-- ═══════════════════════════════════════════════════
DROP TABLE IF EXISTS public.medif_records CASCADE;

-- ═══════════════════════════════════════════════════
-- 2. Remove service_type column from customers (safely)
-- ═══════════════════════════════════════════════════
ALTER TABLE public.customers DROP COLUMN IF EXISTS service_type;

-- ═══════════════════════════════════════════════════
-- 3. Create general_service_records table
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.general_service_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to the customer this record belongs to
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,

  -- Array of UUIDs referencing doc_service_types (the services requested)
  service_ids     UUID[] NOT NULL DEFAULT '{}',

  -- Status of the overall request
  status          TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),

  -- Optional target / expiry date (e.g. passport renewal deadline)
  target_date     DATE,

  -- Free-text remarks / notes
  remarks         TEXT,

  -- Who created the record
  created_by      TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_general_service_records_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gsr_updated_at ON public.general_service_records;
CREATE TRIGGER trg_gsr_updated_at
  BEFORE UPDATE ON public.general_service_records
  FOR EACH ROW EXECUTE FUNCTION update_general_service_records_updated_at();

-- Index for fast customer lookups
CREATE INDEX IF NOT EXISTS idx_gsr_customer_id
  ON public.general_service_records(customer_id);

-- Enable RLS (matching the rest of your tables)
ALTER TABLE public.general_service_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (adjust as needed)
DROP POLICY IF EXISTS "allow_authenticated" ON public.general_service_records;
CREATE POLICY "allow_authenticated"
  ON public.general_service_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
