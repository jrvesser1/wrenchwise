-- Wrenchwise production schema
create extension if not exists pgcrypto;

create table if not exists public.dtc_codes (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 description text not null,
 plain_language text,
 system text,
 manufacturer text,
 source_url text,
 created_at timestamptz not null default now()
);

create table if not exists public.symptoms (
 id uuid primary key default gen_random_uuid(),
 name text not null unique,
 system text not null,
 description text,
 created_at timestamptz not null default now()
);

create table if not exists public.repair_sources (
 id uuid primary key default gen_random_uuid(),
 vehicle_key text not null,
 title text not null,
 source_type text not null,
 url text,
 content text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create table if not exists public.confirmed_fixes (
 id uuid primary key default gen_random_uuid(),
 code_id uuid references public.dtc_codes(id) on delete cascade,
 symptom_id uuid references public.symptoms(id) on delete set null,
 vehicle_key text,
 title text not null,
 description text not null,
 source_url text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);

create table if not exists public.fix_confirmations (
 fix_id uuid references public.confirmed_fixes(id) on delete cascade,
 user_id uuid references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(fix_id,user_id)
);

create table if not exists public.forum_threads (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete set null,
 vehicle_key text not null,
 title text not null,
 body text not null,
 created_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
 id uuid primary key default gen_random_uuid(),
 thread_id uuid references public.forum_threads(id) on delete cascade,
 user_id uuid references auth.users(id) on delete set null,
 body text not null,
 confirmed_fix boolean not null default false,
 created_at timestamptz not null default now()
);

create table if not exists public.noise_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 storage_path text not null,
 filename text not null,
 mime_type text not null,
 size_bytes bigint not null,
 notes text,
 created_at timestamptz not null default now()
);

alter table public.dtc_codes enable row level security;
alter table public.symptoms enable row level security;
alter table public.repair_sources enable row level security;
alter table public.confirmed_fixes enable row level security;
alter table public.fix_confirmations enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.noise_reports enable row level security;

create policy "public read dtc" on public.dtc_codes for select using (true);
create policy "public read symptoms" on public.symptoms for select using (true);
create policy "public read sources" on public.repair_sources for select using (true);
create policy "public read fixes" on public.confirmed_fixes for select using (true);
create policy "public read threads" on public.forum_threads for select using (true);
create policy "public read posts" on public.forum_posts for select using (true);
create policy "users create threads" on public.forum_threads for insert to authenticated with check (auth.uid()=user_id);
create policy "users create posts" on public.forum_posts for insert to authenticated with check (auth.uid()=user_id);
create policy "users read own noise" on public.noise_reports for select to authenticated using (auth.uid()=user_id);
create policy "users insert noise" on public.noise_reports for insert to authenticated with check (auth.uid()=user_id);
create policy "users confirm fixes" on public.fix_confirmations for insert to authenticated with check (auth.uid()=user_id);
create policy "users remove confirmations" on public.fix_confirmations for delete to authenticated using (auth.uid()=user_id);

insert into public.symptoms(name,system,description) values
('Clunk on acceleration','Drivetrain','A knock or clunk heard as throttle is applied or removed.'),
('Severe rattle at idle','Engine','A pronounced rattle while the engine is idling.'),
('Air conditioning not cold','HVAC','Air conditioning output is warmer than expected.')
on conflict(name) do nothing;

insert into storage.buckets(id,name,public) values ('noise-clips','noise-clips',false)
on conflict(id) do nothing;

create policy "users upload own noise" on storage.objects for insert to authenticated
with check (bucket_id='noise-clips' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users read own noise" on storage.objects for select to authenticated
using (bucket_id='noise-clips' and (storage.foldername(name))[1]=auth.uid()::text);
