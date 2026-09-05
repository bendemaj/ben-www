create extension if not exists pgcrypto;

create table if not exists uni_courses (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  credits numeric(6, 2) not null,
  semester text not null,
  status text not null check (status in ('done', 'pending')),
  grade text,
  exam_date text,
  examiner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_uni_courses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists uni_courses_set_updated_at on uni_courses;
create trigger uni_courses_set_updated_at
before update on uni_courses
for each row
execute function set_uni_courses_updated_at();
