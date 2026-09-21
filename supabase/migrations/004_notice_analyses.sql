create table if not exists public.notice_analyses (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null unique references public.notices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  board_name text,
  organization_name text,
  city text,
  state text,
  position_name text,
  exam_date date,
  total_questions integer,
  summary text,
  confidence numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notice_analyses_user
on public.notice_analyses(user_id);

alter table public.notice_analyses enable row level security;

drop policy if exists "users can view own notice analyses" on public.notice_analyses;
create policy "users can view own notice analyses"
on public.notice_analyses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can insert own notice analyses" on public.notice_analyses;
create policy "users can insert own notice analyses"
on public.notice_analyses
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.notices
    where notices.id = notice_analyses.notice_id
      and notices.user_id = auth.uid()
  )
);

drop policy if exists "users can update own notice analyses" on public.notice_analyses;
create policy "users can update own notice analyses"
on public.notice_analyses
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
