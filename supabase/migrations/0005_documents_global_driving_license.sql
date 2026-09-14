-- Driving license belongs to the person, not any one vehicle — unlike
-- compulsory/voluntary insurance and tax, which are per-vehicle. Split
-- `documents` so a row is owned by EXACTLY ONE of {vehicle, user}:
--   - compulsory_insurance / voluntary_insurance / tax  -> vehicle_id set
--   - driving_license                                    -> user_id set
-- A user can have at most one driving_license row (partial unique index).

alter table public.documents
  add column user_id uuid references auth.users (id) on delete cascade;

alter table public.documents
  alter column vehicle_id drop not null;

alter table public.documents
  drop constraint documents_document_type_check;

alter table public.documents
  add constraint documents_owner_matches_type check (
    (document_type = 'driving_license' and vehicle_id is null and user_id is not null)
    or
    (document_type in ('compulsory_insurance', 'voluntary_insurance', 'tax')
      and vehicle_id is not null and user_id is null)
  );

create unique index documents_one_driving_license_per_user
  on public.documents (user_id)
  where document_type = 'driving_license';

create index documents_user_id_idx on public.documents (user_id);

drop policy "documents are managed by the owning vehicle's user" on public.documents;

create policy "documents are managed by their vehicle or account owner"
  on public.documents
  for all
  using (
    (vehicle_id is not null and exists (
      select 1 from public.vehicles v where v.id = documents.vehicle_id and v.user_id = auth.uid()
    ))
    or user_id = auth.uid()
  )
  with check (
    (vehicle_id is not null and exists (
      select 1 from public.vehicles v where v.id = documents.vehicle_id and v.user_id = auth.uid()
    ))
    or user_id = auth.uid()
  );
