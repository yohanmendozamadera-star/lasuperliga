insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('player-photos', 'player-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists player_photos_select on storage.objects;
drop policy if exists player_photos_insert on storage.objects;
drop policy if exists player_photos_update on storage.objects;
drop policy if exists player_photos_delete on storage.objects;

create policy player_photos_select on storage.objects for select to authenticated
using (bucket_id = 'player-photos' and exists (
  select 1 from public.teams tm where tm.id::text = (storage.foldername(name))[1]
  and (tm.owner_id = (select auth.uid()) or exists (
    select 1 from public.tournaments tr where tr.id = tm.tournament_id and tr.owner_id = (select auth.uid())
  ))
));

create policy player_photos_insert on storage.objects for insert to authenticated
with check (bucket_id = 'player-photos' and exists (
  select 1 from public.teams tm where tm.id::text = (storage.foldername(name))[1]
  and (tm.owner_id = (select auth.uid()) or exists (
    select 1 from public.tournaments tr where tr.id = tm.tournament_id and tr.owner_id = (select auth.uid())
  ))
));

create policy player_photos_update on storage.objects for update to authenticated
using (bucket_id = 'player-photos' and exists (
  select 1 from public.teams tm where tm.id::text = (storage.foldername(name))[1]
  and (tm.owner_id = (select auth.uid()) or exists (
    select 1 from public.tournaments tr where tr.id = tm.tournament_id and tr.owner_id = (select auth.uid())
  ))
))
with check (bucket_id = 'player-photos');

create policy player_photos_delete on storage.objects for delete to authenticated
using (bucket_id = 'player-photos' and exists (
  select 1 from public.teams tm where tm.id::text = (storage.foldername(name))[1]
  and (tm.owner_id = (select auth.uid()) or exists (
    select 1 from public.tournaments tr where tr.id = tm.tournament_id and tr.owner_id = (select auth.uid())
  ))
));
