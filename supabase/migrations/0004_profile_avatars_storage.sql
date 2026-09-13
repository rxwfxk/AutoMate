-- Storage bucket for user profile pictures. Same pattern as
-- 0002_vehicle_images_storage.sql / 0003_maintenance_receipts_storage.sql.
--
-- Path convention: `${auth.uid()}/avatar-${timestamp}.${ext}`

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

create policy "Profile avatars are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'profile-avatars');

create policy "Users can upload avatars into their own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update avatars in their own folder"
  on storage.objects
  for update
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete avatars in their own folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
