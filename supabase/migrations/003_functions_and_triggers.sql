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
