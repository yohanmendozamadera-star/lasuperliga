create table if not exists public.subdomain_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  requested_subdomain text not null unique,
  status text not null default 'pending' check (status in ('pending','approved','active','rejected')),
  admin_notes text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  activated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint subdomain_requests_slug_format check (requested_subdomain ~ '^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$'),
  constraint subdomain_requests_owner_match check (requested_subdomain = lower(requested_subdomain))
);

alter table public.subdomain_requests enable row level security;
revoke all on table public.subdomain_requests from anon;
revoke all on table public.subdomain_requests from authenticated;
grant select, insert, update on table public.subdomain_requests to authenticated;
grant select, insert, update, delete on table public.subdomain_requests to service_role;

create policy subdomain_requests_owner_read on public.subdomain_requests for select to authenticated
using (requested_by = (select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'role', '') = 'platform_admin');
create policy subdomain_requests_owner_insert on public.subdomain_requests for insert to authenticated
with check (requested_by = (select auth.uid()) and status = 'pending' and exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = (select auth.uid())));
create policy subdomain_requests_admin_update on public.subdomain_requests for update to authenticated
using (coalesce((select auth.jwt())->'app_metadata'->>'role', '') = 'platform_admin')
with check (coalesce((select auth.jwt())->'app_metadata'->>'role', '') = 'platform_admin');
create index if not exists subdomain_requests_status_requested_at_idx on public.subdomain_requests(status, requested_at desc);
create index if not exists subdomain_requests_requested_by_idx on public.subdomain_requests(requested_by);

alter table public.organizations add column if not exists description text;
alter table public.organizations add column if not exists contact_name text;
alter table public.organizations add column if not exists contact_phone text;
alter table public.organizations add column if not exists contact_email text;
