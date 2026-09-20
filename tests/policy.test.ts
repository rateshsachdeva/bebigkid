import { test } from "node:test";
import assert from "node:assert/strict";
import {
  savedContext,
  cleanCitations,
  citationIds,
  chunkText,
  responsePolicy,
  safeUrl,
} from "../lib/ai-policy";
import { turnSchema, childSchema, configSchema } from "../lib/validation";
import { emptyChild } from "../lib/types";
const note = (text: string, include_in_ai = false) => ({
  id: crypto.randomUUID(),
  text,
  include_in_ai,
  created_at: "2026-01-01",
});
test("context off excludes profile, memories and all journal text", () =>
  assert.equal(
    savedContext(
      false,
      { ...emptyChild, nickname: "PRIVATE" },
      [note("SECRET")],
      [note("HIDDEN", true)],
    ),
    "",
  ));
test("journal is excluded unless explicitly included", () => {
  const c = savedContext(
    true,
    emptyChild,
    [],
    [note("EXCLUDED"), note("INCLUDED", true)],
  );
  assert.ok(!c.includes("EXCLUDED"));
  assert.ok(c.includes("INCLUDED"));
});
test("saved context respects a bounded payload", () =>
  assert.ok(
    savedContext(
      true,
      emptyChild,
      Array.from({ length: 30 }, () => note("x".repeat(1000))),
      [],
    ).length <= 8000,
  ));
test("invented citations are removed and known IDs retained", () => {
  const id = crypto.randomUUID(),
    bad = crypto.randomUUID(),
    sources = [
      {
        id,
        title: "source",
        publisher: "publisher",
        url: "https://example.org",
        text: "reference",
      },
    ];
  assert.equal(
    cleanCitations(`[source:${id}] [source:${bad}]`, sources),
    "[Source] ",
  );
  assert.deepEqual(citationIds(`[source:${id}] [source:${bad}]`, sources), [
    id,
  ]);
});
test("source URLs reject unsafe schemes and credentials", () => {
  for (const v of [
    "javascript:alert(1)",
    "http://example.org",
    "https://user:pass@example.org",
  ])
    assert.equal(safeUrl(v), false);
  assert.equal(safeUrl("https://example.org/source"), true);
});
test("long source passages split without loss", () => {
  const text = "a".repeat(6100);
  const chunks = chunkText(text);
  assert.equal(chunks.join(""), text);
  assert.ok(chunks.every((c) => c.length <= 2200));
});
test("parents cannot submit owner IDs or model choices in a chat turn", () => {
  const turn = {
    threadId: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    message: "Hello",
  };
  assert.ok(turnSchema.safeParse(turn).success);
  assert.ok(
    !turnSchema.safeParse({ ...turn, owner_id: crypto.randomUUID() }).success,
  );
  assert.ok(!turnSchema.safeParse({ ...turn, model: "other" }).success);
  assert.ok(!turnSchema.safeParse({ ...turn, message: " " }).success);
});
test("optional child profile does not demand identifying information", () =>
  assert.ok(childSchema.safeParse(emptyChild).success));
test("model candidates require privacy review and a bounded reply style", () => {
  const config = {
    model_id: "vendor/model",
    providers: ["vendor"],
    input_rate: 1,
    output_rate: 1,
    output_tokens: 1000,
    privacy_reviewed: true,
    behaviour_reviewed: false,
    response_style: {
      length: "balanced",
      max_steps: 3,
      clarifying_question: true,
      match_language: true,
    },
  };
  assert.ok(configSchema.safeParse(config).success);
  assert.ok(
    !configSchema.safeParse({ ...config, privacy_reviewed: false }).success,
  );
  assert.ok(!configSchema.safeParse({ ...config, providers: [] }).success);
  assert.ok(
    !configSchema.safeParse({
      ...config,
      response_style: { ...config.response_style, max_steps: 8 },
    }).success,
  );
});
test("versioned reply style cannot replace the locked safety policy", () => {
  const policy = responsePolicy({
    length: "brief",
    max_steps: 2,
    clarifying_question: false,
    match_language: false,
  });
  assert.match(policy, /60–140 words/);
  assert.match(policy, /no more than 2/);
  assert.doesNotMatch(policy, /punishment|restraint|diagnose/);
});
