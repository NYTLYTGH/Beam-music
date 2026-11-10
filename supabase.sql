-- Run once in Supabase: SQL Editor > New query > paste > Run
create table profiles(id uuid primary key references auth.users on delete cascade, momo text);
create table tracks(
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users,
  title text not null, artist text not null,
  price int not null default 0 check (price >= 0),  -- pesewas (GHS x 100); 0 = free
  path text not null, created_at timestamptz default now());
create table purchases(
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  track_id uuid references tracks on delete set null,
  buyer uuid references auth.users,
  amount int not null, fee int not null, artist_share int not null,
  paid_out boolean default false, created_at timestamptz default now());
alter table profiles enable row level security;
alter table tracks enable row level security;
alter table purchases enable row level security;
create policy "own profile" on profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "read tracks" on tracks for select using (true);
create policy "add own track" on tracks for insert to authenticated with check (owner=auth.uid());
create policy "delete own track" on tracks for delete to authenticated using (owner=auth.uid());
create policy "see own sales and buys" on purchases for select to authenticated
  using (buyer=auth.uid() or exists(select 1 from tracks t where t.id=track_id and t.owner=auth.uid()));
insert into storage.buckets(id,name,public) values('audio','audio',false);
create policy "upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id='audio' and (storage.foldername(name))[1]=auth.uid()::text);
