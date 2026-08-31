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
