alter table public.jobs
  add column last_error text,
  add column last_error_at timestamptz;
