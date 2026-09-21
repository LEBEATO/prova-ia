alter table public.questions
add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists idx_questions_created_by
on public.questions(created_by);

drop policy if exists "users can insert own generated questions" on public.questions;
create policy "users can insert own generated questions"
on public.questions
for insert
to authenticated
with check (
  auth.uid() = created_by
  and is_ai_generated = true
);

drop policy if exists "users can update own generated questions" on public.questions;
create policy "users can update own generated questions"
on public.questions
for update
to authenticated
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

drop policy if exists "users can delete own generated questions" on public.questions;
create policy "users can delete own generated questions"
on public.questions
for delete
to authenticated
using (auth.uid() = created_by);

drop policy if exists "users can insert questions into own simulations" on public.simulation_questions;
create policy "users can insert questions into own simulations"
on public.simulation_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.simulations
    where simulations.id = simulation_questions.simulation_id
      and simulations.user_id = auth.uid()
  )
);

drop policy if exists "users can delete questions from own simulations" on public.simulation_questions;
create policy "users can delete questions from own simulations"
on public.simulation_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.simulations
    where simulations.id = simulation_questions.simulation_id
      and simulations.user_id = auth.uid()
  )
);

drop policy if exists "users can delete own answers" on public.user_answers;
create policy "users can delete own answers"
on public.user_answers
for delete
to authenticated
using (auth.uid() = user_id);
