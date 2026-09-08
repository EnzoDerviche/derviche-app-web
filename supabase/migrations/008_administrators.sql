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
