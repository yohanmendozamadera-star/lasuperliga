create index if not exists tournament_ads_created_by_idx
  on public.tournament_ads (created_by);

drop policy if exists "Public can view active tournament ads" on public.tournament_ads;
drop policy if exists "Tournament owners can view all ads" on public.tournament_ads;

create policy "Visitors can view active tournament ads"
  on public.tournament_ads for select
  to anon
  using (
    active and exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and tournaments.is_public = true
    )
  );

create policy "Authenticated users can view allowed tournament ads"
  on public.tournament_ads for select
  to authenticated
  using (
    exists (
      select 1 from public.tournaments
      where tournaments.id = tournament_ads.tournament_id
        and (
          tournaments.owner_id = (select auth.uid())
          or (tournaments.is_public = true and tournament_ads.active = true)
        )
    )
  );
