-- Derviche Construcciones — initial schema
create extension if not exists "pgcrypto";

-- ── clients ────────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  company text,
  tax_id text,
  phone text,
  email text,
  address text,
  city text,
  province text,
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── budgets ────────────────────────────────────────────────────────────────
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  budget_number text not null unique,
  client_id uuid not null references public.clients(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz,
  accepted_at timestamptz,
  paid_at timestamptz,
  status text not null default 'sent'
    check (status in ('sent','approved','rejected','partial_paid','paid')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','advance_received','partially_paid','fully_paid')),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  tax numeric(14,2) not null default 0 check (tax >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  notes text,
  is_demo boolean not null default false
);

-- ── budget_items ───────────────────────────────────────────────────────────
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  description text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  discount numeric(14,2) not null default 0 check (discount >= 0),
  subtotal numeric(14,2) not null check (subtotal >= 0),
  sort_order integer not null default 0
);

-- ── payments ───────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  payment_date date not null,
  payment_type text not null check (payment_type in ('advance','partial','final','other')),
  notes text,
  created_at timestamptz not null default now()
);

-- Budget number sequence: concurrency-safe, guarantees uniqueness.
create sequence if not exists public.budget_number_seq;
