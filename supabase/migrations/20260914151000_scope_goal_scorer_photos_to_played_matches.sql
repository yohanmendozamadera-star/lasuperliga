drop policy if exists player_goal_scorer_photos_public_read on storage.objects;

create policy player_goal_scorer_photos_public_read on storage.objects
for select to anon
using (
  bucket_id = 'player-photos'
  and exists (
    select 1
    from public.players p
    join public.match_events e on e.player_id = p.id
    join public.matches m on m.id = e.match_id
    where p.photo_url = storage.objects.name
      and e.event_type in ('goal', 'penalty_scored')
      and m.status in ('in_progress', 'finished')
  )
);
