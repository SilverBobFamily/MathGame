-- Cards are public game data — anyone can read them.
-- RLS was enabled on this table (likely via dashboard) but no SELECT policy existed,
-- causing the anon/authenticated roles to see 0 rows.
alter table cards enable row level security;

create policy "cards: public read"
  on cards for select
  using (true);
