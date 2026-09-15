create policy active_goalkeeper_photos_public_read on storage.objects
for select to anon
using (
  bucket_id = 'player-photos'
  and exists (
    select 1
    from public.players p
    join public.teams team on team.id = p.team_id
    join public.matches m on (m.home_team_id = team.id or m.away_team_id = team.id)
    where p.photo_url = storage.objects.name
      and p.active = true
      and (lower(p.position) like '%arquero%' or lower(p.position) like '%portero%')
      and m.status in ('in_progress', 'finished')
  )
);
