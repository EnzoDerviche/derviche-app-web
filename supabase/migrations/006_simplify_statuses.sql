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
