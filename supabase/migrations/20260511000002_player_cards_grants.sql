-- supabase/migrations/20260511000002_player_cards_grants.sql
-- Patch for already-applied 20260511000001_player_cards migration.
-- Adds missing privilege, trigger lockdown, and card_id index.

-- Grant SELECT privilege so RLS policies are reachable by authenticated clients
grant select on player_cards to authenticated;

-- Lock down trigger function (consistency with grant_starter_cards lockdown)
revoke execute on function trigger_grant_starter_cards() from public, anon, authenticated;

-- Index for FK enforcement performance on card deletes
create index player_cards_card_id_idx on player_cards (card_id);
