-- Grant anon and authenticated roles permission to query player_release_access.
-- Without this, the RLS subquery on releases (checking private access) throws
-- a permission-denied error that breaks all releases queries for non-service clients.
grant select on player_release_access to anon, authenticated;
