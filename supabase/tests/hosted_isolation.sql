-- Run only in the dedicated project. All fixtures and configuration roll back.
begin;
select set_config('test.parent_a',gen_random_uuid()::text,true),set_config('test.parent_b',gen_random_uuid()::text,true),set_config('test.thread',gen_random_uuid()::text,true),set_config('test.request',gen_random_uuid()::text,true);
insert into auth.users(id)values(current_setting('test.parent_a')::uuid),(current_setting('test.parent_b')::uuid);
insert into public.parent_profiles(user_id,consent_at)values(current_setting('test.parent_a')::uuid,now()),(current_setting('test.parent_b')::uuid,now());
insert into public.threads(id,owner_id)values(current_setting('test.thread')::uuid,current_setting('test.parent_a')::uuid);
insert into public.memory_items(owner_id,text,source_thread_id)values(current_setting('test.parent_a')::uuid,'Synthetic private fact',current_setting('test.thread')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.parent_b'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.threads where id=current_setting('test.thread')::uuid) then raise exception 'Cross-parent thread leak';end if;
 if exists(select 1 from public.memory_items where owner_id=current_setting('test.parent_a')::uuid) then raise exception 'Cross-parent memory leak';end if;
 begin
  insert into public.threads(owner_id)values(current_setting('test.parent_a')::uuid);
  raise exception 'Cross-parent write allowed';
 exception when insufficient_privilege then null;end;
 if has_function_privilege(current_user,'public.begin_turn(uuid,uuid,uuid,text,text,numeric)','execute') then raise exception 'Parent may call privileged RPC';end if;
end $$;
reset role;
update public.operating_settings set paused=false,monthly_budget=100000;
select public.begin_turn(current_setting('test.parent_a')::uuid,current_setting('test.thread')::uuid,current_setting('test.request')::uuid,'Synthetic request','test/no-provider',0.1);
select public.finish_turn(current_setting('test.parent_a')::uuid,current_setting('test.thread')::uuid,current_setting('test.request')::uuid,'Synthetic reply',0.05,10,10,null,'[]','completed');
select public.finish_turn(current_setting('test.parent_a')::uuid,current_setting('test.thread')::uuid,current_setting('test.request')::uuid,'Duplicate reply',0.05,10,10,null,'[]','completed');
do $$ begin
 if (select count(*) from public.messages where thread_id=current_setting('test.thread')::uuid)<>2 then raise exception 'Duplicate completion';end if;
 if not exists(select 1 from storage.buckets where id='parent-exports' and not public)then raise exception 'Export bucket not private';end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity)then raise exception 'Missing RLS';end if;
end $$;
delete from public.threads where id=current_setting('test.thread')::uuid;
do $$ begin
 if exists(select 1 from public.memory_items where owner_id=current_setting('test.parent_a')::uuid)then raise exception 'Linked memory did not cascade';end if;
end $$;
select public.request_deletion(current_setting('test.parent_a')::uuid);
select set_config('request.jwt.claim.sub',current_setting('test.parent_a'),true);
set local role authenticated;
do $$ begin
 if exists(select 1 from public.parent_profiles)then raise exception 'Deleted account remains accessible';end if;
end $$;
reset role;
-- Exercise the unchanged pgvector-backed retrieval function signature too.
select * from public.search_knowledge(null,'synthetic check');
rollback;
