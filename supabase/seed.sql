-- Demo / test data. All rows carry is_demo = true so they can be removed safely.
-- Loaded by `supabase db reset`, or from the app's Configuración page.

begin;

-- Fixed UUIDs so items/payments can reference budgets deterministically.
insert into public.clients (id, first_name, last_name, company, tax_id, phone, email, address, city, province, is_demo) values
  ('11111111-1111-1111-1111-111111111111', 'Juan',  'García',    'García SRL',            '20-11111111-1', '11-5555-1111', 'juan@garcia.test',  'Av. Siempreviva 742', 'Quilmes',    'Buenos Aires', true),
  ('22222222-2222-2222-2222-222222222222', 'María', 'López',     null,                    '27-22222222-2', '11-5555-2222', 'maria@lopez.test',  'Calle Falsa 123',     'Berazategui','Buenos Aires', true),
  ('33333333-3333-3333-3333-333333333333', 'Pedro', 'Fernández', 'Constructora Fernández','30-33333333-3', '11-5555-3333', 'pedro@fernandez.test','Ruta 2 km 45',      'La Plata',   'Buenos Aires', true)
on conflict (id) do nothing;

-- Budgets (budget_number auto-assigned by trigger).
insert into public.budgets (id, client_id, status, payment_status, subtotal, discount, tax, total, sent_at, accepted_at, paid_at, is_demo) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'partial_paid', 'advance_received', 80000,  0,     16800, 96800,  now() - interval '10 days', now() - interval '7 days', null, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'sent',         'unpaid',          40000,  0,     0,     40000,  null, null, null, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'paid',         'fully_paid',      300000, 20000, 58800, 338800, now() - interval '60 days', now() - interval '55 days', now() - interval '5 days', true),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'sent',         'unpaid',          30000,  0,     0,     30000,  now() - interval '2 days', null, null, true)
on conflict (id) do nothing;

insert into public.budget_items (budget_id, description, quantity, unit, unit_price, discount, subtotal, sort_order) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Pintura de fachada',        10, 'm²',     5000,  0, 50000,  0),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Mano de obra',              1,  'global', 30000, 0, 30000,  1),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Consultoría técnica',       5,  'hora',   8000,  0, 40000,  0),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Contrapiso y carpeta',      100,'m²',     3000,  0, 300000, 0),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Inspección de obra',        2,  'servicio',15000,0, 30000,  0);

insert into public.payments (budget_id, amount, payment_date, payment_type, notes) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 30000,  current_date - 6, 'advance', 'Adelanto inicial'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 100000, current_date - 50,'advance', 'Adelanto'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 100000, current_date - 30,'partial', 'Segundo pago'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 138800, current_date - 5, 'final',   'Cancelación total');

commit;
