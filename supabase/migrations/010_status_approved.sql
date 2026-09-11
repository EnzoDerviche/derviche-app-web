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
