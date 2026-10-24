create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  ign text check (ign is null or char_length(ign) <= 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.join_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  ign text check (ign is null or char_length(ign) <= 40),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 1 and 120),
  detail text not null default '', starts_at timestamptz, published boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 1 and 120),
  body text not null default '', published boolean not null default false, created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.join_applications enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
create policy "Profiles are readable by owner" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can submit own application" on public.join_applications for insert to authenticated with check (auth.uid() = user_id and status = 'pending');
create policy "Users can view own applications" on public.join_applications for select to authenticated using (auth.uid() = user_id);
create policy "Published events are public" on public.events for select to anon, authenticated using (published = true);
create policy "Published announcements are public" on public.announcements for select to anon, authenticated using (published = true);
revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
revoke all on public.join_applications from anon, authenticated;
grant select, insert on public.join_applications to authenticated;
revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
revoke all on public.announcements from anon, authenticated;
grant select on public.announcements to anon, authenticated;
