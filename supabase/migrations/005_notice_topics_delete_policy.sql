drop policy if exists "users can delete topics from own notices" on public.notice_topics;
create policy "users can delete topics from own notices"
on public.notice_topics
for delete
to authenticated
using (
  exists (
    select 1
    from public.notices
    where notices.id = notice_topics.notice_id
      and notices.user_id = auth.uid()
  )
);
