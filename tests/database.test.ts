import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
// Local PostgreSQL isolation tests. Hosted Auth, Storage, pgvector and network
// behaviour still require separate Supabase integration tests before launch.
test("database isolation, budget idempotency and deletion races", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create schema extensions;
create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    let sql = readFileSync(
      "supabase/migrations/" + readdirSync("supabase/migrations")[0],
      "utf8",
    );
    // This fixture excludes only vector retrieval, unavailable in this WASM build.
    sql = sql
      .replace(
        "create extension if not exists vector with schema extensions;",
        "",
      )
      .replace("embedding extensions.vector(1536)", "embedding real[]")
      .replace(
        /create function public.search_knowledge[\s\S]*?limit 6;\$\$;/,
        "",
      )
      .replaceAll(",public.search_knowledge(extensions.vector,text)", "");
    await db.exec(sql);
    const a = crypto.randomUUID(),
      b = crypto.randomUUID(),
      thread = crypto.randomUUID(),
      request = crypto.randomUUID();
    await db.query("insert into auth.users values($1),($2)", [a, b]);
    await db.query(
      "insert into parent_profiles(user_id,consent_at) values($1,now()),($2,now())",
      [a, b],
    );
    await db.query("insert into threads(id,owner_id) values($1,$2)", [
      thread,
      a,
    ]);
    await db.query(
      "insert into memory_items(owner_id,text,source_thread_id) values($1,$2,$3)",
      [a, "Private fact", thread],
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
    await db.exec("set role authenticated");
    assert.equal((await db.query("select * from threads")).rows.length, 0);
    assert.equal((await db.query("select * from memory_items")).rows.length, 0);
    await assert.rejects(
      db.query("insert into threads(owner_id) values($1)", [a]),
    );
    await assert.rejects(db.query("select * from admin_memberships"));
    await assert.rejects(
      db.query("select begin_turn($1,$2,$3,$4,$5,1)", [
        a,
        thread,
        request,
        "secret",
        "model",
      ]),
    );
    await db.exec(
      "reset role;update operating_settings set paused=false,monthly_budget=1",
    );
    await db.query("select begin_turn($1,$2,$3,$4,$5,0.8)", [
      a,
      thread,
      request,
      "hello",
      "model",
    ]);
    await assert.rejects(
      db.query("select begin_turn($1,$2,$3,$4,$5,0.8)", [
        a,
        thread,
        request,
        "hello",
        "model",
      ]),
    );
    assert.equal((await db.query("select * from messages")).rows.length, 1);
    await db.query(
      "select finish_turn($1,$2,$3,'answer',0.5,10,10,null,'[]','completed')",
      [a, thread, request],
    );
    await db.query(
      "select finish_turn($1,$2,$3,'answer',0.5,10,10,null,'[]','completed')",
      [a, thread, request],
    );
    assert.equal((await db.query("select * from messages")).rows.length, 2);
    assert.equal(
      Number(
        (
          await db.query<{ settled: string }>(
            "select settled from budget_counters",
          )
        ).rows[0].settled,
      ),
      0.5,
    );
    await assert.rejects(
      db.query("select begin_turn($1,$2,$3,$4,$5,0.8)", [
        a,
        thread,
        crypto.randomUUID(),
        "hello",
        "model",
      ]),
    );
    const late = crypto.randomUUID();
    await db.query("select begin_turn($1,$2,$3,$4,$5,0.1)", [
      a,
      thread,
      late,
      "last",
      "model",
    ]);
    await db.query("delete from threads where id=$1", [thread]);
    assert.equal((await db.query("select * from memory_items")).rows.length, 0);
    await db.query(
      "select finish_turn($1,$2,$3,'late answer',0.1,10,10,null,'[]','completed')",
      [a, thread, late],
    );
    assert.equal((await db.query("select * from messages")).rows.length, 0);
    await db.query("select request_deletion($1)", [a]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [a]);
    await db.exec("set role authenticated");
    assert.equal(
      (await db.query("select * from parent_profiles")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("insert into child_profiles(owner_id,nickname) values($1,$2)", [
        a,
        "Cannot write",
      ]),
    );
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});
