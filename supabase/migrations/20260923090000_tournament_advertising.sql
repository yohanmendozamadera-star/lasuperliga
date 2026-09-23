create table if not exists public.tournament_ads (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  title text,
  image_url text not null,
  storage_path text not null,
  link_url text,
  display_order integer not null default 0 check (display_order >= 0),
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tournament_ads_public_order_idx
  on public.tournament_ads (tournament_id, active, display_order, created_at);

alter table public.tournament_ads enable row level security;

grant select on public.tournament_ads to anon;
grant select, insert, update, delete on public.tournament_ads to authenticated;

create policy "Public can view active tournament ads"
  on public.tournament_ads for select
  to anon, authenticated
  using (
    active and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.is_public = true
    )
  );

create policy "Tournament owners can view all ads"
  on public.tournament_ads for select
  to authenticated
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

create policy "Tournament owners can create ads"
  on public.tournament_ads for insert
  to authenticated
  with check (
    created_by = (select auth.uid()) and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

create policy "Tournament owners can update ads"
  on public.tournament_ads for update
  to authenticated
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  )
  with check (
    created_by = (select auth.uid()) and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

create policy "Tournament owners can delete ads"
  on public.tournament_ads for delete
  to authenticated
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tournament-ads',
  'tournament-ads',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Tournament owners can upload advertising"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tournament-ads' and exists (
      select 1 from public.tournaments
      where tournaments.id::text = (storage.foldername(name))[1]
        and tournaments.owner_id = (select auth.uid())
    )
  );

create policy "Tournament owners can update advertising"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tournament-ads' and exists (
      select 1 from public.tournaments
      where tournaments.id::text = (storage.foldername(name))[1]
        and tournaments.owner_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'tournament-ads' and exists (
      select 1 from public.tournaments
      where tournaments.id::text = (storage.foldername(name))[1]
        and tournaments.owner_id = (select auth.uid())
    )
  );

create policy "Tournament owners can delete advertising"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tournament-ads' and exists (
      select 1 from public.tournaments
      where tournaments.id::text = (storage.foldername(name))[1]
        and tournaments.owner_id = (select auth.uid())
    )
  );
