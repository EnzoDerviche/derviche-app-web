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
