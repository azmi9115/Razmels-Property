-- Razmels Property Management System - Supabase Schema

-- 1. Buildings (Bangunan/Kamar)
CREATE TABLE public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., DA01, B01
    type VARCHAR(50) NOT NULL,        -- 'Kontrakan' or 'Kosan'
    rent_price NUMERIC NOT NULL,
    rent_period VARCHAR(50) NOT NULL, -- 'Bulanan' or 'Tahunan'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tenants (Penghuni)
CREATE TABLE public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nik VARCHAR(50),
    phone_1 VARCHAR(50),
    phone_2 VARCHAR(50),
    emergency_contact VARCHAR(50),
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    entry_date DATE,
    exit_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- 'Active' or 'Deactive'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payments (Pembayaran Sewa)
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    transfer_date DATE NOT NULL,
    rent_duration_months NUMERIC,
    rent_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cashflow (Arus Kas)
CREATE TABLE public.cashflow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,     -- 'Pemasukan' or 'Pengeluaran'
    category VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    amount NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note:
-- Setelah Anda membuat project di Supabase (https://supabase.com), 
-- cukup copy-paste kode SQL ini ke dalam fitur "SQL Editor" di dashboard Supabase Anda dan jalankan.
