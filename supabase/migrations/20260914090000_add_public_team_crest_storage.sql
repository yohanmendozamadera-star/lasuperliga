insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('team-crests','team-crests',true,3145728,array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists team_crests_insert on storage.objects;
drop policy if exists team_crests_update on storage.objects;
drop policy if exists team_crests_delete on storage.objects;

create policy team_crests_insert on storage.objects for insert to authenticated
with check (bucket_id='team-crests' and exists (
 select 1 from public.teams tm where tm.id::text=(storage.foldername(storage.objects.name))[1]
 and (tm.owner_id=(select auth.uid()) or exists(select 1 from public.tournaments tr where tr.id=tm.tournament_id and tr.owner_id=(select auth.uid())))
));
create policy team_crests_update on storage.objects for update to authenticated
using (bucket_id='team-crests' and exists (
 select 1 from public.teams tm where tm.id::text=(storage.foldername(storage.objects.name))[1]
 and (tm.owner_id=(select auth.uid()) or exists(select 1 from public.tournaments tr where tr.id=tm.tournament_id and tr.owner_id=(select auth.uid())))
)) with check (bucket_id='team-crests');
create policy team_crests_delete on storage.objects for delete to authenticated
using (bucket_id='team-crests' and exists (
 select 1 from public.teams tm where tm.id::text=(storage.foldername(storage.objects.name))[1]
 and (tm.owner_id=(select auth.uid()) or exists(select 1 from public.tournaments tr where tr.id=tm.tournament_id and tr.owner_id=(select auth.uid())))
));
