-- Derviche Construcciones — esquema completo (001..010)
-- Pegar TODO en Supabase > SQL Editor y ejecutar. Idempotente.

-- ============================================================
-- 001_initial_schema
-- ============================================================
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

-- ============================================================
-- 002_indexes
-- ============================================================
-- Trigram search for fast, case-insensitive ILIKE on names/company.
create extension if not exists pg_trgm;

create index if not exists idx_clients_first_name_trgm on public.clients using gin (first_name gin_trgm_ops);
create index if not exists idx_clients_last_name_trgm  on public.clients using gin (last_name gin_trgm_ops);
create index if not exists idx_clients_company_trgm     on public.clients using gin (company gin_trgm_ops);
create index if not exists idx_clients_tax_id on public.clients (tax_id);
create index if not exists idx_clients_phone  on public.clients (phone);
create index if not exists idx_clients_email  on public.clients (email);

create index if not exists idx_budgets_client_id      on public.budgets (client_id);
create index if not exists idx_budgets_status         on public.budgets (status);
create index if not exists idx_budgets_payment_status on public.budgets (payment_status);
create index if not exists idx_budgets_created_at     on public.budgets (created_at desc);
create index if not exists idx_budgets_number_trgm    on public.budgets using gin (budget_number gin_trgm_ops);

create index if not exists idx_budget_items_budget_id on public.budget_items (budget_id);
create index if not exists idx_payments_budget_id     on public.payments (budget_id);

-- ============================================================
-- 003_functions_and_triggers
-- ============================================================
-- ── updated_at maintenance ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();

drop trigger if exists trg_budgets_updated_at on public.budgets;
create trigger trg_budgets_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ── budget number generation ────────────────────────────────────────────────
create or replace function public.next_budget_number()
returns text language sql volatile as $$
  select 'PRES-' || lpad(nextval('public.budget_number_seq')::text, 6, '0');
$$;

-- Assign a number on insert if the caller didn't supply one. Race-free via sequence.
create or replace function public.assign_budget_number()
returns trigger language plpgsql as $$
begin
  if new.budget_number is null or new.budget_number = '' then
    new.budget_number := public.next_budget_number();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_budgets_number on public.budgets;
create trigger trg_budgets_number before insert on public.budgets
  for each row execute function public.assign_budget_number();

-- ── dashboard stats (single round-trip) ─────────────────────────────────────
create or replace function public.dashboard_stats()
returns json language sql stable as $$
  select json_build_object(
    'total_clients', (select count(*) from public.clients),
    'total_budgets', (select count(*) from public.budgets),
    'by_status', coalesce((
      select json_object_agg(status, cnt)
      from (select status, count(*) cnt from public.budgets group by status) s
    ), '{}'::json),
    'budgets_with_balance', (
      select count(*) from public.budgets
      where payment_status <> 'fully_paid' and status not in ('draft','rejected','cancelled')
    ),
    'total_budgeted', coalesce((
      select sum(total) from public.budgets where status not in ('draft','rejected','cancelled')
    ), 0),
    'total_collected', coalesce((select sum(amount) from public.payments), 0),
    'total_pending', coalesce((
      select sum(b.total - coalesce((select sum(p.amount) from public.payments p where p.budget_id = b.id), 0))
      from public.budgets b
      where b.status not in ('draft','rejected','cancelled')
    ), 0)
  );
$$;

-- ============================================================
-- 004_rls
-- ============================================================
-- Row Level Security. Internal app: any authenticated user has full access.
-- Structured per-operation so future roles (admin/employee/viewer) can narrow it.

alter table public.clients      enable row level security;
alter table public.budgets      enable row level security;
alter table public.budget_items enable row level security;
alter table public.payments     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['clients','budgets','budget_items','payments'] loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);

    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (true)', t || '_delete', t);
  end loop;
end $$;

-- Expose helper functions to authenticated clients.
grant execute on function public.next_budget_number() to authenticated;
grant execute on function public.dashboard_stats() to authenticated;

-- ============================================================
-- 005_budget_rpc
-- ============================================================
-- Atomic budget writes + payment-status recalculation.
-- Totals are computed by the app (single source of truth in TS) and passed in;
-- these functions only persist, atomically, inside one transaction.

create or replace function public.recalc_budget_payment(p_budget_id uuid)
returns void language plpgsql as $$
declare
  v_total  numeric(14,2);
  v_paid   numeric(14,2);
  v_count  int;
  v_status text;
begin
  select total into v_total from public.budgets where id = p_budget_id;
  select coalesce(sum(amount), 0), count(*) into v_paid, v_count
    from public.payments where budget_id = p_budget_id;

  if v_paid <= 0 then
    v_status := 'unpaid';
  elsif v_paid >= v_total then
    v_status := 'fully_paid';
  elsif v_count <= 1 then
    v_status := 'advance_received';
  else
    v_status := 'partially_paid';
  end if;

  update public.budgets
    set payment_status = v_status,
        paid_at = case when v_status = 'fully_paid' then coalesce(paid_at, now()) else null end
    where id = p_budget_id;
end;
$$;

create or replace function public.create_budget(
  p_client_id uuid,
  p_status text,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total numeric,
  p_notes text,
  p_sent_at timestamptz,
  p_accepted_at timestamptz,
  p_items jsonb
) returns uuid language plpgsql as $$
declare
  v_id uuid;
  v_item jsonb;
  v_i int := 0;
begin
  insert into public.budgets (client_id, status, subtotal, discount, tax, total, notes, sent_at, accepted_at)
    values (p_client_id, p_status, p_subtotal, p_discount, p_tax, p_total, p_notes, p_sent_at, p_accepted_at)
    returning id into v_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.budget_items (budget_id, description, quantity, unit, unit_price, discount, subtotal, sort_order)
      values (
        v_id,
        v_item->>'description',
        (v_item->>'quantity')::numeric,
        v_item->>'unit',
        (v_item->>'unit_price')::numeric,
        coalesce((v_item->>'discount')::numeric, 0),
        (v_item->>'subtotal')::numeric,
        v_i
      );
    v_i := v_i + 1;
  end loop;

  return v_id;
end;
$$;

create or replace function public.update_budget(
  p_id uuid,
  p_client_id uuid,
  p_status text,
  p_subtotal numeric,
  p_discount numeric,
  p_tax numeric,
  p_total numeric,
  p_notes text,
  p_sent_at timestamptz,
  p_accepted_at timestamptz,
  p_items jsonb
) returns void language plpgsql as $$
declare
  v_item jsonb;
  v_i int := 0;
begin
  update public.budgets set
    client_id = p_client_id,
    status = p_status,
    subtotal = p_subtotal,
    discount = p_discount,
    tax = p_tax,
    total = p_total,
    notes = p_notes,
    sent_at = p_sent_at,
    accepted_at = p_accepted_at
  where id = p_id;

  delete from public.budget_items where budget_id = p_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.budget_items (budget_id, description, quantity, unit, unit_price, discount, subtotal, sort_order)
      values (
        p_id,
        v_item->>'description',
        (v_item->>'quantity')::numeric,
        v_item->>'unit',
        (v_item->>'unit_price')::numeric,
        coalesce((v_item->>'discount')::numeric, 0),
        (v_item->>'subtotal')::numeric,
        v_i
      );
    v_i := v_i + 1;
  end loop;

  perform public.recalc_budget_payment(p_id);
end;
$$;

grant execute on function public.recalc_budget_payment(uuid) to authenticated;
grant execute on function public.create_budget(uuid,text,numeric,numeric,numeric,numeric,text,timestamptz,timestamptz,jsonb) to authenticated;
grant execute on function public.update_budget(uuid,uuid,text,numeric,numeric,numeric,numeric,text,timestamptz,timestamptz,jsonb) to authenticated;

-- ============================================================
-- 006_simplify_statuses
-- ============================================================
-- Simplifica los estados de presupuesto a: sent (Enviado) / partial_paid (Cobro parcial) / paid (Cobrado).
-- El estado avanza automáticamente con los pagos.

alter table public.budgets alter column status drop default;

-- Mapear datos existentes al nuevo set según el pago real.
update public.budgets set status = case
  when payment_status = 'fully_paid' then 'paid'
  when payment_status in ('advance_received', 'partially_paid') then 'partial_paid'
  else 'sent'
end;

alter table public.budgets drop constraint if exists budgets_status_check;
alter table public.budgets add constraint budgets_status_check
  check (status in ('sent', 'partial_paid', 'paid'));

alter table public.budgets alter column status set default 'sent';

-- recalc ahora también avanza el estado visible desde los pagos.
create or replace function public.recalc_budget_payment(p_budget_id uuid)
returns void language plpgsql as $$
declare
  v_total  numeric(14,2);
  v_paid   numeric(14,2);
  v_count  int;
  v_pay    text;
  v_status text;
begin
  select total into v_total from public.budgets where id = p_budget_id;
  select coalesce(sum(amount), 0), count(*) into v_paid, v_count
    from public.payments where budget_id = p_budget_id;

  if v_paid <= 0 then
    v_pay := 'unpaid';        v_status := 'sent';
  elsif v_paid >= v_total then
    v_pay := 'fully_paid';    v_status := 'paid';
  elsif v_count <= 1 then
    v_pay := 'advance_received'; v_status := 'partial_paid';
  else
    v_pay := 'partially_paid';   v_status := 'partial_paid';
  end if;

  update public.budgets
    set payment_status = v_pay,
        status = v_status,
        paid_at = case when v_pay = 'fully_paid' then coalesce(paid_at, now()) else null end
    where id = p_budget_id;
end;
$$;

-- dashboard_stats sin referencias a estados eliminados.
create or replace function public.dashboard_stats()
returns json language sql stable as $$
  select json_build_object(
    'total_clients', (select count(*) from public.clients),
    'total_budgets', (select count(*) from public.budgets),
    'by_status', coalesce((
      select json_object_agg(status, cnt)
      from (select status, count(*) cnt from public.budgets group by status) s
    ), '{}'::json),
    'budgets_with_balance', (
      select count(*) from public.budgets where payment_status <> 'fully_paid'
    ),
    'total_budgeted', coalesce((select sum(total) from public.budgets), 0),
    'total_collected', coalesce((select sum(amount) from public.payments), 0),
    'total_pending', coalesce((
      select sum(b.total - coalesce((select sum(p.amount) from public.payments p where p.budget_id = b.id), 0))
      from public.budgets b
    ), 0)
  );
$$;

-- ============================================================
-- 007_client_addresses
-- ============================================================
-- Un cliente puede tener varias direcciones (ej. administrador de edificios).
create table if not exists public.client_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  label text,                 -- ej. "Edificio Alberdi 128"
  address text not null,
  city text,
  province text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_addresses_client_id on public.client_addresses (client_id);

-- Un presupuesto puede apuntar a una dirección específica del cliente (opcional).
alter table public.budgets
  add column if not exists address_id uuid references public.client_addresses(id) on delete set null;

-- RLS: acceso completo para usuarios autenticados (igual que el resto).
alter table public.client_addresses enable row level security;

drop policy if exists client_addresses_select on public.client_addresses;
drop policy if exists client_addresses_insert on public.client_addresses;
drop policy if exists client_addresses_update on public.client_addresses;
drop policy if exists client_addresses_delete on public.client_addresses;

create policy client_addresses_select on public.client_addresses for select to authenticated using (true);
create policy client_addresses_insert on public.client_addresses for insert to authenticated with check (true);
create policy client_addresses_update on public.client_addresses for update to authenticated using (true) with check (true);
create policy client_addresses_delete on public.client_addresses for delete to authenticated using (true);

-- ============================================================
-- 008_administrators
-- ============================================================
-- Administradores (ej. administradores de edificios). Un administrador tiene varios clientes.
create table if not exists public.administrators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_administrators_updated_at on public.administrators;
create trigger trg_administrators_updated_at before update on public.administrators
  for each row execute function public.set_updated_at();

-- Cada cliente puede estar asignado a un administrador (opcional).
alter table public.clients
  add column if not exists administrator_id uuid references public.administrators(id) on delete set null;

create index if not exists idx_clients_administrator_id on public.clients (administrator_id);

-- RLS: acceso completo para autenticados (igual que el resto).
alter table public.administrators enable row level security;

drop policy if exists administrators_select on public.administrators;
drop policy if exists administrators_insert on public.administrators;
drop policy if exists administrators_update on public.administrators;
drop policy if exists administrators_delete on public.administrators;

create policy administrators_select on public.administrators for select to authenticated using (true);
create policy administrators_insert on public.administrators for insert to authenticated with check (true);
create policy administrators_update on public.administrators for update to authenticated using (true) with check (true);
create policy administrators_delete on public.administrators for delete to authenticated using (true);

-- ============================================================
-- 009_prospects
-- ============================================================
-- Prospectos: clientes potenciales para los que se hace un presupuesto antes de
-- registrarlos. Quedan ocultos de la lista de clientes hasta que se aprueban.
alter table public.clients
  add column if not exists is_prospect boolean not null default false;

create index if not exists idx_clients_is_prospect on public.clients (is_prospect);

-- El dashboard cuenta solo los clientes registrados (no los prospectos).
create or replace function public.dashboard_stats()
returns json language sql stable as $$
  select json_build_object(
    'total_clients', (select count(*) from public.clients where is_prospect = false),
    'total_budgets', (select count(*) from public.budgets),
    'by_status', coalesce((
      select json_object_agg(status, cnt)
      from (select status, count(*) cnt from public.budgets group by status) s
    ), '{}'::json),
    'budgets_with_balance', (
      select count(*) from public.budgets where payment_status <> 'fully_paid'
    ),
    'total_budgeted', coalesce((select sum(total) from public.budgets), 0),
    'total_collected', coalesce((select sum(amount) from public.payments), 0),
    'total_pending', coalesce((
      select sum(b.total - coalesce((select sum(p.amount) from public.payments p where p.budget_id = b.id), 0))
      from public.budgets b
    ), 0)
  );
$$;

-- ============================================================
-- 010_status_approved
-- ============================================================
-- Estados: Enviado, Aprobado, Desaprobado, Cobro parcial, Cobrado.
alter table public.budgets drop constraint if exists budgets_status_check;
alter table public.budgets add constraint budgets_status_check
  check (status in ('sent', 'approved', 'rejected', 'partial_paid', 'paid'));

-- recalc: los pagos avanzan a Cobro parcial / Cobrado, pero NO tocan el estado
-- cuando no hay pagos (así se respetan Aprobado/Desaprobado/Enviado).
create or replace function public.recalc_budget_payment(p_budget_id uuid)
returns void language plpgsql as $$
declare
  v_total  numeric(14,2);
  v_paid   numeric(14,2);
  v_count  int;
  v_pay    text;
  v_status text;
begin
  select total into v_total from public.budgets where id = p_budget_id;
  select coalesce(sum(amount), 0), count(*) into v_paid, v_count
    from public.payments where budget_id = p_budget_id;

  if v_paid <= 0 then
    v_pay := 'unpaid';           v_status := null;
  elsif v_paid >= v_total then
    v_pay := 'fully_paid';       v_status := 'paid';
  elsif v_count <= 1 then
    v_pay := 'advance_received'; v_status := 'partial_paid';
  else
    v_pay := 'partially_paid';   v_status := 'partial_paid';
  end if;

  update public.budgets
    set payment_status = v_pay,
        status = coalesce(v_status, status),
        paid_at = case when v_pay = 'fully_paid' then coalesce(paid_at, now()) else null end
    where id = p_budget_id;
end;
$$;

