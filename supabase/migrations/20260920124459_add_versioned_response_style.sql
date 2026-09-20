alter table public.ai_config_versions
  add column response_style jsonb not null default
    '{"length":"balanced","max_steps":3,"clarifying_question":true,"match_language":true}'::jsonb;

alter table public.ai_config_versions
  add constraint ai_config_versions_response_style_check check (
    response_style ?& array['length','max_steps','clarifying_question','match_language']
    and response_style->>'length' in ('brief','balanced','detailed')
    and (response_style->>'max_steps')::integer between 1 and 4
    and jsonb_typeof(response_style->'clarifying_question') = 'boolean'
    and jsonb_typeof(response_style->'match_language') = 'boolean'
  );
