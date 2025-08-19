
begin;

-- 1) Policies de user_roles: limpar e recriar de forma idempotente
drop policy if exists "Admins can manage all roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can delete roles" on public.user_roles;
drop policy if exists "Users can view their own roles" on public.user_roles;

create policy "Users can view their own roles"
  on public.user_roles
  for select
  using (user_id = auth.uid());

create policy "Admins can view all roles"
  on public.user_roles
  for select
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can insert roles"
  on public.user_roles
  for insert
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can update roles"
  on public.user_roles
  for update
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins can delete roles"
  on public.user_roles
  for delete
  using (has_role(auth.uid(), 'admin'::app_role));

-- 2) Triggers updated_at: dropar se existirem e recriar
drop trigger if exists update_radar_brasis_updated_at on public.radar_brasis;
create trigger update_radar_brasis_updated_at
  before update on public.radar_brasis
  for each row
  execute function public.audit_updated_at();

drop trigger if exists update_radar_sources_updated_at on public.radar_sources;
create trigger update_radar_sources_updated_at
  before update on public.radar_sources
  for each row
  execute function public.audit_updated_at();

drop trigger if exists update_radar_keywords_updated_at on public.radar_keywords;
create trigger update_radar_keywords_updated_at
  before update on public.radar_keywords
  for each row
  execute function public.audit_updated_at();

drop trigger if exists update_user_roles_updated_at on public.user_roles;
create trigger update_user_roles_updated_at
  before update on public.user_roles
  for each row
  execute function public.audit_updated_at();

-- 3) Funções de emergência: reforço de permissões
revoke all on function public.emergency_disable_all_rls() from public, anon, authenticated;
revoke all on function public.emergency_disable_rls_brasis() from public, anon, authenticated;
revoke all on function public.emergency_disable_rls_sources() from public, anon, authenticated;
revoke all on function public.emergency_disable_rls_keywords() from public, anon, authenticated;

grant execute on function public.emergency_disable_all_rls() to postgres;
grant execute on function public.emergency_disable_rls_brasis() to postgres;
grant execute on function public.emergency_disable_rls_sources() to postgres;
grant execute on function public.emergency_disable_rls_keywords() to postgres;

commit;
