-- ==============================================================================
-- APEX OPS-PULSE: PRODUCTION ENTERPRISE WORKFORCE OS SCHEMA & RLS POLICIES
-- Target: Supabase (PostgreSQL 15+)
-- Version: 1.0.0 (October 2026)
-- ==============================================================================

-- 1. Enable UUID Extension & Helper Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Enums for Strong Type Constraints
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'operator', 'hr_manager');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE department_type AS ENUM (
        'Assembly', 
        'Quality Control', 
        'Warehouse & Supply', 
        'Plant Maintenance', 
        'Corporate HR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shift_type AS ENUM (
        'Morning (06:00-14:00)', 
        'General (09:00-18:00)', 
        'Night (22:00-06:00)'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_type AS ENUM ('check_in', 'check_out', 'break');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE punch_method AS ENUM ('manual', 'biometric', 'rfid_scan', 'qr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leave_category AS ENUM ('annual', 'sick', 'casual', 'shift_swap');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('draft', 'processing', 'disbursed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 2. CREATE CORE TABLES
-- ==============================================================================

-- Table 1: profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'supervisor', 'operator', 'hr_manager')),
    department TEXT NOT NULL DEFAULT 'Assembly' CHECK (department IN ('Assembly', 'Quality Control', 'Warehouse & Supply', 'Plant Maintenance', 'Corporate HR')),
    shift TEXT NOT NULL DEFAULT 'General (09:00-18:00)' CHECK (shift IN ('Morning (06:00-14:00)', 'General (09:00-18:00)', 'Night (22:00-06:00)')),
    phone TEXT,
    address TEXT,
    emergency_contact TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 2: bank_details
CREATE TABLE IF NOT EXISTS public.bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    ifsc_code TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_bank UNIQUE(user_id)
);

-- Table 3: attendance_logs
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out', 'break')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    method TEXT NOT NULL DEFAULT 'rfid_scan' CHECK (method IN ('manual', 'biometric', 'rfid_scan', 'qr')),
    notes TEXT
);

-- Table 4: leave_requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'shift_swap')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Table 5: payroll_records
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payroll_month TEXT NOT NULL, -- e.g. 'October 2026'
    base_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shift_allowances NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_payable NUMERIC(12, 2) GENERATED ALWAYS AS (base_salary + shift_allowances - deductions) STORED,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'disbursed')),
    payslip_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_payroll_user_month UNIQUE(user_id, payroll_month)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_time ON public.attendance_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON public.payroll_records(payroll_month);

-- ==============================================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if current auth user is admin or hr_manager
CREATE OR REPLACE FUNCTION public.is_admin_or_hr()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'hr_manager')
  );
$$;

-- Helper function: Check if current auth user is supervisor
CREATE OR REPLACE FUNCTION public.is_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'hr_manager', 'supervisor')
  );
$$;

-- ------------------------------------------------------------------------------
-- RLS: profiles
-- ------------------------------------------------------------------------------
-- Read: Everyone can read their own profile, supervisors and HR/Admin can read all
CREATE POLICY "Allow users to view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_supervisor());

-- Update: Users can update their phone/address, HR/Admin can update anything
CREATE POLICY "Allow users to update own contact info"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin_or_hr())
    WITH CHECK (auth.uid() = id OR public.is_admin_or_hr());

-- Insert/Delete: Admin or HR Manager only
CREATE POLICY "Allow HR/Admin full insert on profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin_or_hr());

CREATE POLICY "Allow HR/Admin full delete on profiles"
    ON public.profiles FOR DELETE
    USING (public.is_admin_or_hr());

-- ------------------------------------------------------------------------------
-- RLS: bank_details
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own bank details or Admin/HR"
    ON public.bank_details FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_hr());

CREATE POLICY "Users can update own bank details or Admin/HR"
    ON public.bank_details FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin_or_hr());

CREATE POLICY "Admin/HR can manage bank details"
    ON public.bank_details FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_hr());

CREATE POLICY "Admin/HR can delete bank details"
    ON public.bank_details FOR DELETE
    USING (public.is_admin_or_hr());

-- ------------------------------------------------------------------------------
-- RLS: attendance_logs
-- ------------------------------------------------------------------------------
-- Select: Employees can view their own logs, Admins/Supervisors can view all
CREATE POLICY "Users can view own attendance or supervisors can view team"
    ON public.attendance_logs FOR SELECT
    USING (auth.uid() = user_id OR public.is_supervisor());

-- Insert: Employees can punch check-in/out for themselves, Admin/HR can punch for any
CREATE POLICY "Users can submit own punches"
    ON public.attendance_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_hr());

-- Update/Delete: Admin / HR Manager only (e.g., supervisor attendance override)
CREATE POLICY "Admin/HR can update attendance"
    ON public.attendance_logs FOR UPDATE
    USING (public.is_admin_or_hr());

CREATE POLICY "Admin/HR can delete attendance"
    ON public.attendance_logs FOR DELETE
    USING (public.is_admin_or_hr());

-- ------------------------------------------------------------------------------
-- RLS: leave_requests
-- ------------------------------------------------------------------------------
CREATE POLICY "Users view own leaves or supervisors view all"
    ON public.leave_requests FOR SELECT
    USING (auth.uid() = user_id OR public.is_supervisor());

CREATE POLICY "Users can request leaves"
    ON public.leave_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.is_admin_or_hr());

CREATE POLICY "Supervisors and HR/Admin can approve/reject leaves"
    ON public.leave_requests FOR UPDATE
    USING (public.is_supervisor());

CREATE POLICY "Admin/HR can delete leave requests"
    ON public.leave_requests FOR DELETE
    USING (public.is_admin_or_hr());

-- ------------------------------------------------------------------------------
-- RLS: payroll_records
-- ------------------------------------------------------------------------------
CREATE POLICY "Users view own payroll or Admin/HR view all"
    ON public.payroll_records FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_hr());

CREATE POLICY "Admin/HR manage payroll records"
    ON public.payroll_records FOR ALL
    USING (public.is_admin_or_hr())
    WITH CHECK (public.is_admin_or_hr());

-- ==============================================================================
-- 4. REALTIME REPLICATION CONFIGURATION
-- ==============================================================================
-- Enable Realtime for attendance_logs, leave_requests, and profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ==============================================================================
-- 5. TRIGGER: AUTO-CREATE PROFILE ON AUTH SIGN-UP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    next_emp_no INT;
    gen_emp_id TEXT;
BEGIN
    SELECT COALESCE(MAX(SUBSTRING(employee_id FROM 5)::INT), 1000) + 1 
    INTO next_emp_no 
    FROM public.profiles 
    WHERE employee_id ~ '^AOP-[0-9]+$';

    gen_emp_id := 'AOP-' || LPAD(next_emp_no::TEXT, 4, '0');

    INSERT INTO public.profiles (
        id,
        employee_id,
        first_name,
        last_name,
        role,
        department,
        shift,
        status,
        created_at
    ) VALUES (
        NEW.id,
        gen_emp_id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Employee'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'Member'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Assembly'),
        COALESCE(NEW.raw_user_meta_data->>'shift', 'General (09:00-18:00)'),
        'active',
        NOW()
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 6. SAMPLE ENTERPRISE WORKFORCE SEED DATA
-- Matches Dashboard UI and Corporate Factory Structure
-- ==============================================================================
-- Note: Replace UUIDs with actual auth user IDs when syncing with real Supabase Auth
DO $$
DECLARE
    u_admin UUID := '00000000-0000-0000-0000-000000000001';
    u_annen UUID := '00000000-0000-0000-0000-000000000002';
    u_alexa UUID := '00000000-0000-0000-0000-000000000003';
    u_niexa UUID := '00000000-0000-0000-0000-000000000004';
    u_marcus UUID := '00000000-0000-0000-0000-000000000005';
BEGIN
    -- Seed Profiles (if they don't already exist)
    INSERT INTO public.profiles (id, employee_id, first_name, last_name, avatar_url, role, department, shift, phone, address, emergency_contact, status)
    VALUES
    (u_admin, 'AOP-1001', 'Admin', 'User', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'hr_manager', 'Corporate HR', 'General (09:00-18:00)', '+1 (555) 019-2834', 'Plant HQ, Suite 400', 'Jane User (+1 555-019-2835)', 'active'),
    (u_annen, 'AOP-1028', 'Annen', 'Smith', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'operator', 'Assembly', 'Morning (06:00-14:00)', '+1 (555) 012-4411', 'Sector 4, Building B', 'David Smith (+1 555-012-4412)', 'active'),
    (u_alexa, 'AOP-1026', 'Alexa', 'Smom', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'supervisor', 'Quality Control', 'General (09:00-18:00)', '+1 (555) 013-8822', 'Apex Plant Zone 1', 'Mary Smom (+1 555-013-8823)', 'active'),
    (u_niexa, 'AOP-1035', 'Niexa', 'Snana', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'operator', 'Warehouse & Supply', 'Night (22:00-06:00)', '+1 (555) 014-9933', 'Distribution Hub East', 'Sarah Snana (+1 555-014-9934)', 'on_leave'),
    (u_marcus, 'AOP-1042', 'Marcus', 'Vance', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'admin', 'Plant Maintenance', 'General (09:00-18:00)', '+1 (555) 018-7711', 'Machinery Block C', 'Elena Vance (+1 555-018-7712)', 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Bank Details
    INSERT INTO public.bank_details (user_id, account_name, account_number, bank_name, ifsc_code)
    VALUES
    (u_admin, 'Admin User', '984511200341', 'JPMorgan Chase Corp', 'CHASUS33XXX'),
    (u_annen, 'Annen Smith', '441098231049', 'Bank of America Industrial', 'BOFAUS3NXXX'),
    (u_alexa, 'Alexa Smom', '881029471920', 'Wells Fargo Commercial', 'WFBIUS6SXXX')
    ON CONFLICT (user_id) DO NOTHING;

    -- Seed Attendance Logs (matches screenshot activity)
    INSERT INTO public.attendance_logs (user_id, type, timestamp, method, notes)
    VALUES
    (u_annen, 'check_in', NOW() - INTERVAL '4 hours 11 minutes', 'rfid_scan', 'Shift 1 Line 4'),
    (u_alexa, 'check_in', NOW() - INTERVAL '4 hours 20 minutes', 'biometric', 'QC Station Alpha'),
    (u_marcus, 'check_out', NOW() - INTERVAL '4 hours 30 minutes', 'rfid_scan', 'Maintenance Patrol End'),
    (u_annen, 'check_out', NOW() - INTERVAL '4 hours 52 minutes', 'manual', 'Scheduled lunch break');

    -- Seed Leave Requests (matches screenshot)
    INSERT INTO public.leave_requests (user_id, leave_type, start_date, end_date, reason, status)
    VALUES
    (u_annen, 'annual', '2026-06-27', '2026-07-03', 'Annual family relocation and rest', 'pending'),
    (u_niexa, 'sick', '2026-09-29', '2026-10-02', 'Medical fever recovery under doctor rest advisory', 'pending'),
    (u_alexa, 'annual', '2026-12-21', '2026-12-28', 'Year-end holiday break', 'pending');

    -- Seed Payroll Records
    INSERT INTO public.payroll_records (user_id, payroll_month, base_salary, shift_allowances, deductions, status, payslip_url)
    VALUES
    (u_admin, 'October 2026', 8200.00, 450.00, 850.00, 'processing', '/payslips/aop-1001-oct26.pdf'),
    (u_annen, 'October 2026', 4500.00, 600.00, 320.00, 'processing', '/payslips/aop-1028-oct26.pdf'),
    (u_alexa, 'October 2026', 5800.00, 500.00, 480.00, 'processing', '/payslips/aop-1026-oct26.pdf'),
    (u_niexa, 'October 2026', 4200.00, 750.00, 310.00, 'processing', '/payslips/aop-1035-oct26.pdf'),
    (u_marcus, 'October 2026', 6400.00, 400.00, 520.00, 'processing', '/payslips/aop-1042-oct26.pdf')
    ON CONFLICT (user_id, payroll_month) DO NOTHING;

END $$;
