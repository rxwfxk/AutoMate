-- Storage bucket for maintenance receipt photos. Same pattern as
-- 0002_vehicle_images_storage.sql: public bucket, writes gated to each
-- user's own folder.
--
-- Path convention: `${auth.uid()}/${maintenanceLogId}-${timestamp}.${ext}`

insert into storage.buckets (id, name, public)
values ('maintenance-receipts', 'maintenance-receipts', true)
on conflict (id) do nothing;

create policy "Maintenance receipts are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'maintenance-receipts');

create policy "Users can upload receipts into their own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update receipts in their own folder"
  on storage.objects
  for update
  using (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete receipts in their own folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'maintenance-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
