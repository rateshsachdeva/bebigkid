-- Dedicated Alongside database only. Never apply to unrelated applications.
create schema if not exists private;
create extension if not exists vector with schema extensions;

create table public.parent_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'active' check(status in ('active','deleting')),
 consent_version text, consent_at timestamptz, context_version bigint not null default 1,
 created_at timestamptz not null default now()
);
create table public.consent_events(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,version text not null,accepted boolean not null,created_at timestamptz not null default now());
create table public.child_profiles(owner_id uuid primary key references public.parent_profiles(user_id) on delete cascade,nickname text not null default '' check(length(nickname)<=40),age_years integer check(age_years between 0 and 25),communication text not null default '' check(length(communication)<=1500),sensory text not null default '' check(length(sensory)<=1500),interests text not null default '' check(length(interests)<=1500),concerns text not null default '' check(length(concerns)<=1500),updated_at timestamptz not null default now());
create table public.threads(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,title text not null default 'Conversation' check(length(title)<=120),use_saved_context boolean not null default true,created_at timestamptz not null default now(),unique(id,owner_id));
create table public.messages(id uuid primary key default gen_random_uuid(),owner_id uuid not null,thread_id uuid not null,role text not null check(role in('user','assistant')),content text not null check(octet_length(content)<=100000),request_id uuid not null,status text not null default 'completed',config_id uuid,citations jsonb not null default '[]',created_at timestamptz not null default now(),foreign key(thread_id,owner_id) references public.threads(id,owner_id) on delete cascade,unique(owner_id,request_id,role));
create table public.memory_items(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,text text not null check(length(text) between 1 and 1000),source_thread_id uuid,created_at timestamptz not null default now(),foreign key(source_thread_id,owner_id) references public.threads(id,owner_id) on delete cascade);
create table public.journal_entries(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,text text not null check(length(text) between 1 and 4000),include_in_ai boolean not null default false,created_at timestamptz not null default now());
create table public.thread_summaries(id uuid primary key default gen_random_uuid(),owner_id uuid not null,thread_id uuid not null,text text not null,context_version bigint not null,through_message_id uuid,created_at timestamptz not null default now(),foreign key(thread_id,owner_id) references public.threads(id,owner_id) on delete cascade);
create table public.context_dependencies(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,message_id uuid references public.messages(id) on delete cascade,source_id uuid not null,source_type text not null);
create table public.admin_memberships(user_id uuid primary key references auth.users(id) on delete cascade,role text not null check(role in('owner','content_editor')),active boolean not null default true);
create table public.pilot_invites(email_hash text primary key,expires_at timestamptz not null,created_at timestamptz not null default now());
create table public.knowledge_sources(id uuid primary key default gen_random_uuid(),title text not null,publisher text not null,url text not null,licence text not null,text text not null check(octet_length(text)<=100000),state text not null default 'draft' check(state in('draft','indexing','indexed','published','error')),version integer not null default 1,reviewer text,reviewed_at timestamptz,review_due timestamptz,created_at timestamptz not null default now());
create table public.knowledge_chunks(id uuid primary key default gen_random_uuid(),source_id uuid not null references public.knowledge_sources(id) on delete cascade,text text not null,embedding extensions.vector(1536),version integer not null);
create table public.model_catalogue(id text primary key,name text not null,metadata jsonb not null default '{}',fetched_at timestamptz not null default now());
create table public.ai_config_versions(id uuid primary key default gen_random_uuid(),model_id text not null,fallback_id text,providers text[] not null,output_tokens integer not null default 1200 check(output_tokens between 100 and 1200),input_rate numeric not null check(input_rate>=0),output_rate numeric not null check(output_rate>=0),privacy_reviewed boolean not null default false,behaviour_reviewed boolean not null default false,created_by uuid not null references auth.users(id),created_at timestamptz not null default now());
create table public.evaluation_runs(id uuid primary key default gen_random_uuid(),config_id uuid not null references public.ai_config_versions(id),state text not null default 'pending',results jsonb not null default '[]',reviewer uuid,reviewed_at timestamptz,created_at timestamptz not null default now());
create table public.active_config(singleton boolean primary key default true check(singleton),config_id uuid references public.ai_config_versions(id));
insert into public.active_config(singleton) values(true);
create table public.operating_settings(singleton boolean primary key default true check(singleton),monthly_budget numeric not null default 0 check(monthly_budget>=0),daily_turns integer not null default 30 check(daily_turns between 1 and 100),paused boolean not null default true);
insert into public.operating_settings(singleton) values(true);
create table public.usage_events(id uuid primary key,owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,thread_id uuid references public.threads(id) on delete set null,model_id text not null,status text not null default 'generating',reserved numeric not null,actual numeric,input_tokens integer,output_tokens integer,created_at timestamptz not null default now());
create table public.budget_counters(month text primary key,reserved numeric not null default 0,settled numeric not null default 0);
create table public.jobs(id uuid primary key default gen_random_uuid(),kind text not null check(kind in('export','delete-account','index-source','evaluation')),owner_id uuid,target_id uuid,state text not null default 'queued' check(state in('queued','running','completed','failed')),attempts integer not null default 0,lease_until timestamptz,next_run timestamptz not null default now(),created_at timestamptz not null default now());
create table public.export_requests(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.parent_profiles(user_id) on delete cascade,job_id uuid references public.jobs(id),object_path text,expires_at timestamptz,created_at timestamptz not null default now());
create table public.audit_events(id uuid primary key default gen_random_uuid(),actor_id uuid,action text not null,target_id text,created_at timestamptz not null default now());
create table public.deletion_ledger(owner_id uuid primary key,requested_at timestamptz not null default now(),completed_at timestamptz);

-- This narrow helper returns only the caller's state, not another user's record.
create function private.is_active() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.parent_profiles where user_id=(select auth.uid()) and status='active' and consent_at is not null); $$;
revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.is_active() from public;
grant execute on function private.is_active() to authenticated;

do $$ declare t text;begin
 foreach t in array array['parent_profiles','consent_events','child_profiles','threads','messages','memory_items','journal_entries','thread_summaries','context_dependencies','admin_memberships','pilot_invites','knowledge_sources','knowledge_chunks','model_catalogue','ai_config_versions','evaluation_runs','active_config','operating_settings','usage_events','budget_counters','jobs','export_requests','audit_events','deletion_ledger'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
grant select on public.parent_profiles to authenticated;
create policy profile_read on public.parent_profiles for select to authenticated using(user_id=(select auth.uid()) and status='active');
do $$ declare t text;begin
 foreach t in array array['child_profiles','threads','messages','memory_items','journal_entries','thread_summaries','consent_events','export_requests'] loop
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy own_read on public.%I for select to authenticated using(owner_id=(select auth.uid()) and private.is_active())',t);
 end loop;
 foreach t in array array['child_profiles','threads','memory_items','journal_entries'] loop
 execute format('grant insert,update,delete on public.%I to authenticated',t);
 execute format('create policy own_insert on public.%I for insert to authenticated with check(owner_id=(select auth.uid()) and private.is_active())',t);
 execute format('create policy own_update on public.%I for update to authenticated using(owner_id=(select auth.uid()) and private.is_active()) with check(owner_id=(select auth.uid()) and private.is_active())',t);
 execute format('create policy own_delete on public.%I for delete to authenticated using(owner_id=(select auth.uid()) and private.is_active())',t);
 end loop;
end $$;
create index threads_owner_created on public.threads(owner_id,created_at desc);
create index messages_thread_created on public.messages(thread_id,created_at);
create index usage_owner_created on public.usage_events(owner_id,created_at);
create unique index one_live_generation on public.usage_events(owner_id) where status='generating';
create index jobs_ready on public.jobs(state,next_run);
create index chunks_source on public.knowledge_chunks(source_id);

create function private.invalidate_context() returns trigger language plpgsql security definer set search_path='' as $$ declare u uuid;begin
 u:=coalesce(new.owner_id,old.owner_id);update public.parent_profiles set context_version=context_version+1 where user_id=u;delete from public.thread_summaries where owner_id=u;return coalesce(new,old);end $$;
revoke all on function private.invalidate_context() from public;
create trigger child_context after insert or update or delete on public.child_profiles for each row execute function private.invalidate_context();
create trigger memory_context after insert or update or delete on public.memory_items for each row execute function private.invalidate_context();
create trigger journal_context after insert or update or delete on public.journal_entries for each row execute function private.invalidate_context();

-- Privileged RPCs are service-only. The application authenticates and checks ownership first;
-- the transaction repeats those checks to protect against deletion/concurrency races.
create function public.begin_turn(u uuid,t uuid,r uuid,body text,model text,reserve_cost numeric) returns boolean language plpgsql security definer set search_path='' as $$
declare settings public.operating_settings;counter public.budget_counters;mon text:=to_char(now() at time zone 'UTC','YYYY-MM');begin
 perform 1 from public.parent_profiles where user_id=u and status='active' and consent_at is not null for update;if not found then raise exception 'account_unavailable';end if;
 perform 1 from public.threads where id=t and owner_id=u for update;if not found then raise exception 'thread_unavailable';end if;
 if exists(select 1 from public.usage_events where id=r) then raise exception 'duplicate_request';end if;
 select * into settings from public.operating_settings where singleton=true;
 if settings.paused then raise exception 'service_paused';end if;
 if (select count(*) from public.usage_events where owner_id=u and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC')>=settings.daily_turns then raise exception 'daily_limit';end if;
 if (select count(*) from public.usage_events where owner_id=u and created_at>now()-interval '1 minute')>=5 then raise exception 'rate_limit';end if;
 if exists(select 1 from public.usage_events where owner_id=u and status='generating')then raise exception 'already_generating';end if;
 insert into public.budget_counters(month) values(mon) on conflict do nothing;
 select * into counter from public.budget_counters where month=mon for update;
 if reserve_cost<0 or counter.reserved+counter.settled+reserve_cost>settings.monthly_budget then raise exception 'budget_limit';end if;
 update public.budget_counters set reserved=reserved+reserve_cost where month=mon;
 insert into public.usage_events(id,owner_id,thread_id,model_id,reserved) values(r,u,t,model,reserve_cost);
 insert into public.messages(owner_id,thread_id,role,content,request_id) values(u,t,'user',body,r);
 return true;end $$;
create function public.finish_turn(u uuid,t uuid,r uuid,answer text,cost numeric,in_tokens integer,out_tokens integer,cfg uuid,refs jsonb,end_status text) returns void language plpgsql security definer set search_path='' as $$
declare event public.usage_events;begin
 select * into event from public.usage_events where id=r and owner_id=u for update;
 if not found or event.status<>'generating' then return;end if;
 update public.usage_events set status=end_status,actual=greatest(0,cost),input_tokens=in_tokens,output_tokens=out_tokens where id=r;
 update public.budget_counters set reserved=greatest(0,reserved-event.reserved),settled=settled+greatest(0,cost) where month=to_char(event.created_at at time zone 'UTC','YYYY-MM');
 if exists(select 1 from public.parent_profiles where user_id=u and status='active') and exists(select 1 from public.threads where id=t and owner_id=u) then
 insert into public.messages(owner_id,thread_id,role,content,request_id,status,config_id,citations) values(u,t,'assistant',answer,r,end_status,cfg,refs) on conflict(owner_id,request_id,role) do nothing;
 end if;end $$;
create function public.request_deletion(u uuid) returns uuid language plpgsql security definer set search_path='' as $$ declare j uuid;begin
 update public.parent_profiles set status='deleting' where user_id=u;
 insert into public.deletion_ledger(owner_id)values(u)on conflict do nothing;
 select id into j from public.jobs where kind='delete-account' and owner_id=u and state in('queued','running') limit 1;
 if j is null then insert into public.jobs(kind,owner_id)values('delete-account',u)returning id into j;end if;return j;end $$;
create function public.claim_job() returns setof public.jobs language sql security definer set search_path='' as $$
 update public.jobs set state='running',attempts=attempts+1,lease_until=now()+interval '4 minutes' where id=(select id from public.jobs where (state='queued' or (state='running' and lease_until<now())) and next_run<=now() and attempts<5 order by created_at for update skip locked limit 1) returning *;$$;
create function public.search_knowledge(query_embedding extensions.vector(1536),query_text text) returns table(id uuid,title text,publisher text,url text,text text,score double precision) language sql stable security invoker set search_path='' as $$
 select c.id,s.title,s.publisher,s.url,c.text,case when c.embedding is null or query_embedding is null then 0::double precision else 1-(c.embedding operator(extensions.<=>) query_embedding)end + ts_rank_cd(to_tsvector('english',c.text),plainto_tsquery('english',query_text))::double precision as score
 from public.knowledge_chunks c join public.knowledge_sources s on s.id=c.source_id where s.state='published' and c.version=s.version and (query_embedding is not null or to_tsvector('english',c.text)@@plainto_tsquery('english',query_text)) order by score desc limit 6;$$;
revoke all on function public.begin_turn(uuid,uuid,uuid,text,text,numeric),public.finish_turn(uuid,uuid,uuid,text,numeric,integer,integer,uuid,jsonb,text),public.request_deletion(uuid),public.claim_job(),public.search_knowledge(extensions.vector,text) from public,anon,authenticated;
grant execute on function public.begin_turn(uuid,uuid,uuid,text,text,numeric),public.finish_turn(uuid,uuid,uuid,text,numeric,integer,integer,uuid,jsonb,text),public.request_deletion(uuid),public.claim_job(),public.search_knowledge(extensions.vector,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('parent-exports','parent-exports',false,10485760,array['application/json']) on conflict(id)do nothing;
-- No client storage policies: authenticated application endpoints stream own exports.

create function public.reserve_operation(u uuid,r uuid,model text,reserve_cost numeric) returns void language plpgsql security definer set search_path='' as $$
declare c public.budget_counters;lim numeric;mon text:=to_char(now() at time zone 'UTC','YYYY-MM');begin
 if not exists(select 1 from public.admin_memberships where user_id=u and active)then raise exception 'not_admin';end if;
 insert into public.budget_counters(month)values(mon)on conflict do nothing;
 select * into c from public.budget_counters where month=mon for update;
 select monthly_budget into lim from public.operating_settings where singleton;
 if reserve_cost<0 or c.reserved+c.settled+reserve_cost>lim then raise exception 'budget_limit';end if;
 update public.budget_counters set reserved=reserved+reserve_cost where month=mon;
 insert into public.usage_events(id,owner_id,model_id,reserved)values(r,u,model,reserve_cost);end $$;
revoke all on function public.reserve_operation(uuid,uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.reserve_operation(uuid,uuid,text,numeric) to service_role;
