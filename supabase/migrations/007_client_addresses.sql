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
