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
