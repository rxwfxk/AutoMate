-- Storage bucket for document files (พ.ร.บ./ประกัน/ภาษี/ใบขับขี่ scans).
-- Unlike vehicle-images/maintenance-receipts, these are frequently PDFs
-- (scanned policy documents), not just photos — same owner-scoped RLS
-- pattern as the other buckets otherwise.
--
-- Path convention: `${auth.uid()}/${documentId}-${timestamp}.${ext}`

insert into storage.buckets (id, name, public)
values ('document-files', 'document-files', true)
on conflict (id) do nothing;

create policy "Document files are publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'document-files');

create policy "Users can upload document files into their own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'document-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update document files in their own folder"
  on storage.objects
  for update
  using (
    bucket_id = 'document-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete document files in their own folder"
  on storage.objects
  for delete
  using (
    bucket_id = 'document-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
