-- Create the new table for Documentation Service Types
CREATE TABLE IF NOT EXISTS public.doc_service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Insert some default values based on what was hardcoded in the frontend
INSERT INTO public.doc_service_types (name) VALUES 
('New Passport Creation'), 
('Visa Renewal'),
('Translation Services'),
('Legalization'),
('Medical Certificate')
ON CONFLICT (name) DO NOTHING;

-- Add a new column to documentation_services to store an array of UUIDs
ALTER TABLE public.documentation_services ADD COLUMN IF NOT EXISTS service_type_ids UUID[] DEFAULT '{}';

-- Disable RLS on the new table so the frontend can read it without issues
ALTER TABLE public.doc_service_types DISABLE ROW LEVEL SECURITY;
