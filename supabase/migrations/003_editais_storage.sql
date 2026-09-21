-- Bucket privado para editais em PDF.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editais',
  'editais',
  false,
  20971520,
  array['application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Cada usuário grava arquivos apenas dentro da própria pasta:
-- editais/<auth.uid()>/<arquivo>.pdf

drop policy if exists "users can upload own notices" on storage.objects;
create policy "users can upload own notices"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'editais'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "users can read own notices" on storage.objects;
create policy "users can read own notices"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'editais'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "users can update own notices" on storage.objects;
create policy "users can update own notices"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'editais'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'editais'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "users can delete own notices" on storage.objects;
create policy "users can delete own notices"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'editais'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
