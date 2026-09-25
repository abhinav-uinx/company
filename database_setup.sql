-- Run this script in the Supabase SQL Editor

-- 1. Modify existing employees table for granular permissions
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '["patients", "escorts", "documentation", "invoices", "reports"]'::jsonb;

-- 2. Patient Management Module
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nationality TEXT,
    dob DATE,
    contact_number TEXT,
    email TEXT,
    address TEXT,
    passport_no TEXT,
    passport_expiry DATE,
    passport_photo_url TEXT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Travel & Escort Management
CREATE TABLE IF NOT EXISTS public.escort_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    from_country TEXT,
    to_country TEXT,
    boarding_details TEXT,
    destination_address TEXT,
    escort_required_date DATE,
    flight_no TEXT,
    pnr TEXT,
    flight_date DATE,
    airline TEXT,
    ticket_cost NUMERIC(10, 2) DEFAULT 0,
    escort_employee_iqama TEXT, -- Can't strict FK here if we want soft deletes, but let's just make it TEXT
    status TEXT DEFAULT 'Pending', -- Pending, In-Transit, Completed, Returned
    approx_cost NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Documentation Services Module
CREATE TABLE IF NOT EXISTS public.documentation_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- New Passport Creation, Visa Renewal, Medical Report Attestation, Embassy Documentation, Ticket Booking Assistance
    status TEXT DEFAULT 'Applied', -- Applied, In Process, Completed, Rejected
    checklist JSONB DEFAULT '{}'::jsonb,
    expiry_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Invoice & Billing Module
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
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
    status TEXT DEFAULT 'Unpaid', -- Unpaid, Partially Paid, Paid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_method TEXT,
    remarks TEXT
);

-- 6. Employee Attendance
CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_iqama TEXT NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Present', -- Present, Absent, Leave, Half-day
    leave_type TEXT,
    UNIQUE(employee_iqama, date)
);

-- 7. Employee Salaries
CREATE TABLE IF NOT EXISTS public.employee_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_iqama TEXT NOT NULL,
    month TEXT NOT NULL, -- e.g., '2026-09'
    basic_salary NUMERIC(10, 2) DEFAULT 0,
    advance_payment NUMERIC(10, 2) DEFAULT 0,
    deductions NUMERIC(10, 2) DEFAULT 0,
    net_salary NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'Pending', -- Pending, Paid
    UNIQUE(employee_iqama, month)
);
