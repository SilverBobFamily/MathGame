-- Ensure the avatars bucket exists (may have been created via dashboard)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Authenticated users can upload to their own folder ({userId}/avatar.ext)
create policy "avatars: upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Authenticated users can replace/update their own avatar
create policy "avatars: update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

-- Public read (bucket is public, but explicit policy for completeness)
create policy "avatars: public read"
  on storage.objects for select
  using (bucket_id = 'avatars');
