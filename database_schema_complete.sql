-- =========================================================================
-- MEDESCORT INTERNATIONAL - COMPLETE & ACCURATE DATABASE SCHEMA
-- =========================================================================
-- Run this in your Supabase SQL Editor to ensure all tables, columns,
-- foreign keys, and high-performance indexes are created and synced.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL
);
INSERT INTO public.roles (role_name) VALUES ('admin'), ('staff') ON CONFLICT (role_name) DO NOTHING;

-- 2. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);
INSERT INTO public.departments (name) VALUES 
('Human Resources'), ('Operations'), ('Management')
ON CONFLICT (name) DO NOTHING;

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    username TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'active', -- 'active', 'disabled'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ,
    role UUID REFERENCES public.roles(id)
);

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
    iqama_number TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL,
    photo_url TEXT,
    department TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    job_title TEXT,
    phone_number TEXT,
    role UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active', -- 'active', 'disabled', 'view_only'
    status_acknowledged BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '["customers", "escorts", "documentation", "invoices", "reports"]'::jsonb,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- 5. Active Sessions Table (Records all login and device metadata)
CREATE TABLE IF NOT EXISTS public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'employee'
    ip_address TEXT,
    location TEXT,
    user_agent TEXT,
    browser TEXT,
    os TEXT,
    device TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6. Login Attempts & Rate Limiting Table
CREATE TABLE IF NOT EXISTS public.login_attempts (
    identifier VARCHAR(255) PRIMARY KEY,
    attempts INT DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Services Catalog
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);
INSERT INTO public.services (name) VALUES 
('Medical Escort'), ('General Service')
ON CONFLICT (name) DO NOTHING;

-- 8. Customers / Patients Management Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nationality TEXT,
    dob DATE,
    contact_number TEXT,
    email TEXT,
    address TEXT,
    passport_no TEXT,
    passport_expiry DATE,
    visa_no TEXT,
    visa_type TEXT,
    visa_expiry DATE,
    visa_country TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_condition TEXT,
    current_hospital TEXT,
    fitness_to_fly_url TEXT,
    doctor_reports_urls JSONB DEFAULT '[]'::jsonb,
    iqama_number TEXT,
    service UUID REFERENCES public.services(id) ON DELETE SET NULL,
    passport JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Escort Missions Table
CREATE TABLE IF NOT EXISTS public.escort_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    from_country TEXT,
    to_country TEXT,
    layover_country TEXT,
    boarding_details TEXT,
    destination_address TEXT,
    escort_required_date DATE,
    flight_no TEXT,
    pnr TEXT,
    flight_date DATE,
    airline TEXT,
    ticket_cost NUMERIC(10, 2) DEFAULT 0,
    escort_employee_iqama TEXT,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'In-Transit', 'Completed', 'Returned'
    approx_cost NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Document Service Types
CREATE TABLE IF NOT EXISTS public.doc_service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- 11. General Service & Documentation Records
CREATE TABLE IF NOT EXISTS public.general_service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    service_ids JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'In Process', 'Completed', 'Rejected'
    target_date DATE,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Invoices & Billing Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.escort_missions(id) ON DELETE SET NULL,
    medical_escort_charges NUMERIC(10, 2) DEFAULT 0,
    ticket_charges NUMERIC(10, 2) DEFAULT 0,
    documentation_charges NUMERIC(10, 2) DEFAULT 0,
    other_expenses NUMERIC(10, 2) DEFAULT 0,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax_vat_percent NUMERIC(5, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) DEFAULT 0,
    advance_payment NUMERIC(10, 2) DEFAULT 0,
    balance_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Unpaid', -- 'Unpaid', 'Partially Paid', 'Paid'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Payment History Table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT,
    remarks TEXT
);

-- 14. Document Vault & MEDIF Records
CREATE TABLE IF NOT EXISTS public.medif_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name TEXT,
    passport TEXT,
    status TEXT DEFAULT 'Submitted',
    remarks TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Employee Attendance Table
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_iqama TEXT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Present', -- 'Present', 'Absent', 'Leave', 'Half-day'
    leave_type TEXT,
    UNIQUE(employee_iqama, date)
);

-- 16. Employee Salaries Table
CREATE TABLE IF NOT EXISTS public.employee_salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_iqama TEXT NOT NULL,
    month TEXT NOT NULL, -- e.g., '2026-09'
    basic_salary NUMERIC(10, 2) DEFAULT 0,
    advance_payment NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Paid'
    UNIQUE(employee_iqama, month)
);

-- =========================================================================
-- PERFORMANCE INDEXES (Optimizes query speeds & eliminates delays)
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_customers_service ON public.customers(service);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_passport ON public.customers(passport_no);

CREATE INDEX IF NOT EXISTS idx_escort_missions_customer ON public.escort_missions(customer_id);
CREATE INDEX IF NOT EXISTS idx_escort_missions_status ON public.escort_missions(status);

CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON public.payment_history(invoice_id);

CREATE INDEX IF NOT EXISTS idx_active_sessions_username ON public.active_sessions(username);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON public.active_sessions(id, is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_iqama_date ON public.employee_attendance(employee_iqama, date DESC);
CREATE INDEX IF NOT EXISTS idx_salaries_iqama_month ON public.employee_salaries(employee_iqama, month);
