-- Add a new JSONB column to the customers table to hold an array of uploaded passport file paths/urls
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS passport JSONB DEFAULT '[]'::jsonb;
