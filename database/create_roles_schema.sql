-- 1. Create the roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL
);

-- 2. Insert the 'admin' and 'staff' rows
INSERT INTO public.roles (role_name) VALUES ('admin'), ('staff') ON CONFLICT (role_name) DO NOTHING;

-- 3. Add foreign key 'role' to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS role UUID REFERENCES public.roles(id);

-- 4. Add foreign key 'role' to admins table (assuming the table is named 'admins' based on codebase usage)
ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS role UUID REFERENCES public.roles(id);
