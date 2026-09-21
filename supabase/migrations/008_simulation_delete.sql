drop policy if exists "users can delete own simulations" on public.simulations;
create policy "users can delete own simulations"
on public.simulations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "users can delete own performance" on public.user_performance;
create policy "users can delete own performance"
on public.user_performance
for delete
to authenticated
using (auth.uid() = user_id);
