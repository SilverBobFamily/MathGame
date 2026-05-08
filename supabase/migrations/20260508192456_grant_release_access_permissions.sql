-- Grant anon and authenticated roles permission to query player_release_access.
-- Without this, the RLS subquery on releases (checking private access) throws
-- a permission-denied error that causes all card fetches to return 0 rows.
grant select on player_release_access to anon, authenticated;
