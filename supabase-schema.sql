-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "order" integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  type text not null default 'strength' check (type in ('strength', 'cardio')),
  sets_count integer not null default 3,
  reps text not null default '10',
  rest_seconds integer not null default 60,
  notes text not null default '',
  video_url text
);

-- Assignments: which client sees which workout
create table public.client_workouts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique (client_id, workout_id)
);

-- Meal plans (HTML from .docx conversion)
create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  html text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.client_workouts enable row level security;
alter table public.meal_plans enable row level security;

-- Profiles policies
create policy "read_own_profile" on public.profiles for select using (auth.uid() = id);
create policy "admin_read_all_profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "admin_update_profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Workouts policies
create policy "admin_all_workouts" on public.workouts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "client_read_assigned_workouts" on public.workouts for select using (
  exists (select 1 from public.client_workouts where client_id = auth.uid() and workout_id = id)
);

-- Exercises policies
create policy "admin_all_exercises" on public.exercises for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "client_read_assigned_exercises" on public.exercises for select using (
  exists (select 1 from public.client_workouts where client_id = auth.uid() and workout_id = exercises.workout_id)
);

-- Client workouts policies
create policy "admin_all_assignments" on public.client_workouts for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "client_read_own_assignments" on public.client_workouts for select using (client_id = auth.uid());

-- Meal plans policies
create policy "admin_all_meal_plans" on public.meal_plans for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "client_read_own_meal_plan" on public.meal_plans for select using (client_id = auth.uid());
