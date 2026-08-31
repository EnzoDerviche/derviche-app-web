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
