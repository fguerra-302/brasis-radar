
-- 1) Tabela de multiplicadores por editoria (simples e por usuário)
create table if not exists public.editorial_weights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  editoria text not null,
  multiplier numeric(4,2) not null default 1.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editorial_weights_user_editoria_unique unique (user_id, editoria),
  constraint editorial_weights_multiplier_range check (multiplier >= 0.50 and multiplier <= 2.00)
);

-- RLS
alter table public.editorial_weights enable row level security;

create policy "Users can view their own editorial weights"
  on public.editorial_weights
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own editorial weights"
  on public.editorial_weights
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own editorial weights"
  on public.editorial_weights
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own editorial weights"
  on public.editorial_weights
  for delete
  using (auth.uid() = user_id);

-- Trigger para manter updated_at
drop trigger if exists set_editorial_weights_updated_at on public.editorial_weights;
create trigger set_editorial_weights_updated_at
before update on public.editorial_weights
for each row
execute function public.audit_updated_at();

-- 2) Threshold mínimo por usuário (padrão 3)
alter table public.user_settings
  add column if not exists min_relevance_threshold integer not null default 3;
