drop policy if exists teams_insert on public.teams;

create policy teams_insert
on public.teams
for insert
to authenticated
with check (
  (
    owner_id = (select auth.uid())
    and (
      exists (
        select 1
        from public.tournaments t
        where t.id = teams.tournament_id
          and t.owner_id = (select auth.uid())
      )
      or exists (
        select 1
        from public.team_applications a
        where a.id = teams.application_id
          and a.tournament_id = teams.tournament_id
          and a.applicant_id = (select auth.uid())
          and a.status = 'approved'
      )
    )
  )
  or exists (
    select 1
    from public.tournaments t
    join public.team_applications a
      on a.id = teams.application_id
     and a.tournament_id = teams.tournament_id
    where t.id = teams.tournament_id
      and t.owner_id = (select auth.uid())
      and a.applicant_id = teams.owner_id
      and a.status = 'approved'
  )
);
