alter table public.simulations
add column if not exists difficulty_mode text not null default 'adaptive',
add column if not exists difficulty_level text not null default 'iniciante',
add column if not exists difficulty_profile jsonb not null default '{}'::jsonb,
add column if not exists sequence_number integer not null default 1;

create index if not exists idx_simulations_user_sequence
on public.simulations(user_id, sequence_number);
