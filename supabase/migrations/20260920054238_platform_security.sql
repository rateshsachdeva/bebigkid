-- Supabase's optional auto-RLS event trigger need not be callable through RPC.
-- Keep the platform trigger enabled; restrict only direct client execution.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
