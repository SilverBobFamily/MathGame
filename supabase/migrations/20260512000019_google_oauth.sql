-- Create (or replace) the handle_new_user trigger function.
-- For email/password signups, raw_user_meta_data has a 'username' key —
-- the trigger creates the players row immediately.
-- For Google OAuth signups, 'username' is absent — the trigger does nothing,
-- and the /auth/username page creates the row after the user picks a name.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_username text;
begin
  v_username := new.raw_user_meta_data->>'username';
  if v_username is not null then
    insert into public.players (id, username)
    values (new.id, v_username)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
