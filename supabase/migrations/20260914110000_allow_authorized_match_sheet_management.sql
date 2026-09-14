drop policy if exists sheet_players_manage on public.match_sheet_players;

create policy sheet_players_manage on public.match_sheet_players
for all to authenticated
using (exists (
 select 1 from public.match_sheets s
 join public.matches m on m.id=s.match_id
 join public.tournaments t on t.id=m.tournament_id
 where s.id=match_sheet_players.sheet_id
 and (s.submitted_by=(select auth.uid()) or t.owner_id=(select auth.uid()) or exists(
  select 1 from public.tournament_members tm where tm.tournament_id=t.id and tm.user_id=(select auth.uid()) and tm.role='scorekeeper'
 ))
))
with check (exists (
 select 1 from public.match_sheets s
 join public.matches m on m.id=s.match_id
 join public.tournaments t on t.id=m.tournament_id
 where s.id=match_sheet_players.sheet_id
 and (s.submitted_by=(select auth.uid()) or t.owner_id=(select auth.uid()) or exists(
  select 1 from public.tournament_members tm where tm.tournament_id=t.id and tm.user_id=(select auth.uid()) and tm.role='scorekeeper'
 ))
));
