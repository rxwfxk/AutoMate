-- Storage bucket for vehicle photos.
-- Public bucket: motorcycle photos aren't sensitive, so reads are open and
-- served directly via public URL (no signed-URL refresh logic needed in the
-- app). Writes are still gated by RLS to each user's own folder.
--
-- Path convention: `${auth.uid()}/${vehicleId}-${timestamp}.${ext}`

insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true)
on conflict (id) do nothing;

create policy "Vehicle images are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'vehicle-images');

create policy "Users can upload vehicle images into their own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update vehicle images in their own folder"
  on storage.objects
  for update
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete vehicle images in their own folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'vehicle-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
