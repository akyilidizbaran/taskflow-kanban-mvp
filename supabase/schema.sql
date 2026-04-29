create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.board_members (
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('viewer', 'editor')),
  added_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (board_id, user_id)
);

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_email_lower_idx on public.profiles (lower(email));
create index if not exists board_members_user_id_idx on public.board_members (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);

  return new;
end;
$$;

create or replace function public.sync_or_validate_card_board_id()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_board_id uuid;
begin
  select board_id
  into parent_board_id
  from public.columns
  where id = new.column_id;

  if parent_board_id is null then
    raise exception 'Column % does not exist', new.column_id;
  end if;

  if new.board_id is distinct from parent_board_id then
    raise exception 'Card board_id must match its parent column board_id';
  end if;

  return new;
end;
$$;

insert into public.profiles (id, email, full_name)
select
  auth_user.id,
  coalesce(auth_user.email, ''),
  nullif(auth_user.raw_user_meta_data ->> 'full_name', '')
from auth.users as auth_user
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);

create or replace function public.owns_board(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards
    where id = target_board_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.is_board_owner(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards
    where id = target_board_id
      and owner_id = auth.uid()
  );
$$;

create or replace function public.can_view_board(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_board_owner(target_board_id)
    or exists (
      select 1
      from public.board_members
      where board_id = target_board_id
        and user_id = auth.uid()
    );
$$;

create or replace function public.can_edit_board(target_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_board_owner(target_board_id)
    or exists (
      select 1
      from public.board_members
      where board_id = target_board_id
        and user_id = auth.uid()
        and role = 'editor'
    );
$$;

create or replace function public.list_board_members(target_board_id uuid)
returns table (
  board_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_board_owner(target_board_id) then
    raise exception 'Only the board owner can list board members.';
  end if;

  return query
  select
    board_member.board_id,
    board_member.user_id,
    board_member.role,
    profile.email,
    profile.full_name,
    board_member.created_at
  from public.board_members as board_member
  join public.profiles as profile on profile.id = board_member.user_id
  where board_member.board_id = target_board_id
  order by profile.email asc;
end;
$$;

create or replace function public.share_board_with_email(
  target_board_id uuid,
  target_email text,
  target_role text
)
returns table (
  board_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  resolved_user_id uuid;
begin
  if not public.is_board_owner(target_board_id) then
    raise exception 'Only the board owner can share this board.';
  end if;

  normalized_email := nullif(lower(trim(target_email)), '');

  if normalized_email is null then
    raise exception 'Email is required.';
  end if;

  if target_role not in ('viewer', 'editor') then
    raise exception 'Role must be viewer or editor.';
  end if;

  select profile.id
  into resolved_user_id
  from public.profiles as profile
  where lower(profile.email) = normalized_email
  limit 1;

  if resolved_user_id is null then
    raise exception 'No registered user was found with that email.';
  end if;

  if resolved_user_id = auth.uid() then
    raise exception 'You already own this board.';
  end if;

  insert into public.board_members (board_id, user_id, role, added_by)
  values (target_board_id, resolved_user_id, target_role, auth.uid())
  on conflict on constraint board_members_pkey do update
  set
    role = excluded.role,
    added_by = excluded.added_by;

  return query
  select
    board_member.board_id,
    board_member.user_id,
    board_member.role,
    profile.email,
    profile.full_name,
    board_member.created_at
  from public.board_members as board_member
  join public.profiles as profile on profile.id = board_member.user_id
  where board_member.board_id = target_board_id
    and board_member.user_id = resolved_user_id
  limit 1;
end;
$$;

create or replace function public.update_board_member_role(
  target_board_id uuid,
  target_user_id uuid,
  target_role text
)
returns table (
  board_id uuid,
  user_id uuid,
  role text,
  email text,
  full_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_board_owner(target_board_id) then
    raise exception 'Only the board owner can update roles.';
  end if;

  if target_role not in ('viewer', 'editor') then
    raise exception 'Role must be viewer or editor.';
  end if;

  update public.board_members as board_member
  set role = target_role
  where board_member.board_id = target_board_id
    and board_member.user_id = target_user_id;

  if not found then
    raise exception 'The selected board member was not found.';
  end if;

  return query
  select
    board_member.board_id,
    board_member.user_id,
    board_member.role,
    profile.email,
    profile.full_name,
    board_member.created_at
  from public.board_members as board_member
  join public.profiles as profile on profile.id = board_member.user_id
  where board_member.board_id = target_board_id
    and board_member.user_id = target_user_id
  limit 1;
end;
$$;

create or replace function public.remove_board_member(
  target_board_id uuid,
  target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_board_owner(target_board_id) then
    raise exception 'Only the board owner can remove members.';
  end if;

  delete from public.board_members as board_member
  where board_member.board_id = target_board_id
    and board_member.user_id = target_user_id;

  if not found then
    raise exception 'The selected board member was not found.';
  end if;

  return true;
end;
$$;

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at
before update on public.boards
for each row
execute function public.set_updated_at();

drop trigger if exists columns_set_updated_at on public.columns;
create trigger columns_set_updated_at
before update on public.columns
for each row
execute function public.set_updated_at();

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
before update on public.cards
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

drop trigger if exists cards_validate_board_id on public.cards;
create trigger cards_validate_board_id
before insert or update on public.cards
for each row
execute function public.sync_or_validate_card_board_id();

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "Profiles are updateable by owner" on public.profiles;
create policy "Profiles are updateable by owner"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Boards are accessible to participants" on public.boards;
create policy "Boards are accessible to participants"
on public.boards
for select
using (public.can_view_board(id));

drop policy if exists "Boards are creatable by authenticated owner" on public.boards;
create policy "Boards are creatable by authenticated owner"
on public.boards
for insert
with check (owner_id = auth.uid());

drop policy if exists "Boards are updateable by owner" on public.boards;
create policy "Boards are updateable by owner"
on public.boards
for update
using (public.is_board_owner(id))
with check (owner_id = auth.uid());

drop policy if exists "Boards are deletable by owner" on public.boards;
create policy "Boards are deletable by owner"
on public.boards
for delete
using (public.is_board_owner(id));

drop policy if exists "Board memberships are visible to owners and their members" on public.board_members;
create policy "Board memberships are visible to owners and their members"
on public.board_members
for select
using (public.is_board_owner(board_id) or user_id = auth.uid());

drop policy if exists "Columns are visible to board participants" on public.columns;
create policy "Columns are visible to board participants"
on public.columns
for select
using (public.can_view_board(board_id));

drop policy if exists "Columns are editable by board editors" on public.columns;
create policy "Columns are editable by board editors"
on public.columns
for insert
with check (public.can_edit_board(board_id));

drop policy if exists "Columns are updateable by board editors" on public.columns;
create policy "Columns are updateable by board editors"
on public.columns
for update
using (public.can_edit_board(board_id))
with check (public.can_edit_board(board_id));

drop policy if exists "Columns are deletable by board editors" on public.columns;
create policy "Columns are deletable by board editors"
on public.columns
for delete
using (public.can_edit_board(board_id));

drop policy if exists "Cards are visible to board participants" on public.cards;
create policy "Cards are visible to board participants"
on public.cards
for select
using (public.can_view_board(board_id));

drop policy if exists "Cards are creatable by board editors" on public.cards;
create policy "Cards are creatable by board editors"
on public.cards
for insert
with check (public.can_edit_board(board_id));

drop policy if exists "Cards are updateable by board editors" on public.cards;
create policy "Cards are updateable by board editors"
on public.cards
for update
using (public.can_edit_board(board_id))
with check (public.can_edit_board(board_id));

drop policy if exists "Cards are deletable by board editors" on public.cards;
create policy "Cards are deletable by board editors"
on public.cards
for delete
using (public.can_edit_board(board_id));
