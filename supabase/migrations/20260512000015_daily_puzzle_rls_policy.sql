-- Allow authenticated users to read daily_puzzles directly
-- (security definer functions already bypass RLS, this enables direct queries)
create policy "authenticated users can read daily_puzzles"
  on public.daily_puzzles for select
  to authenticated
  using (true);
