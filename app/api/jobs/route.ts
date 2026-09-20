import { NextResponse } from "next/server";
import { timingSafeEqual, randomUUID } from "node:crypto";
import { service, check, failure, AppError } from "@/lib/server";
import {
  chunkText,
  reserveCost,
  responsePolicy,
  SYSTEM_POLICY,
} from "@/lib/ai-policy";
import { generateText, modelOptions } from "@/lib/gateway";
import { evaluationCases } from "@/lib/evaluations";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET,
    provided = req.headers.get("authorization") ?? "";
  if (
    !expected ||
    provided.length !== ("Bearer " + expected).length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from("Bearer " + expected))
  )
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  try {
    const db = service();
    const { data: expired } = await db
      .from("export_requests")
      .select("id,object_path")
      .lt("expires_at", new Date().toISOString())
      .limit(25);
    for (const ex of expired ?? []) {
      if (ex.object_path)
        check(
          (await db.storage.from("parent-exports").remove([ex.object_path]))
            .error,
        );
      check((await db.from("export_requests").delete().eq("id", ex.id)).error);
    }
    const { data: stale } = await db
      .from("usage_events")
      .select("*")
      .eq("status", "generating")
      .lt("created_at", new Date(Date.now() - 120000).toISOString())
      .limit(10);
    for (const e of stale ?? [])
      await db.rpc("finish_turn", {
        u: e.owner_id,
        t: e.thread_id,
        r: e.id,
        answer: "",
        cost: e.reserved,
        in_tokens: 0,
        out_tokens: 0,
        cfg: null,
        refs: [],
        end_status: "interrupted",
      });
    const { data: claimed, error } = await db.rpc("claim_job");
    check(error);
    const job = claimed?.[0];
    if (!job) return NextResponse.json({ processed: 0 });
    let requeue = false;
    try {
      if (job.kind === "delete-account") {
        const { data: ex } = await db
          .from("export_requests")
          .select("object_path")
          .eq("owner_id", job.owner_id);
        const paths = (ex ?? []).map((e) => e.object_path).filter(Boolean);
        if (paths.length)
          check((await db.storage.from("parent-exports").remove(paths)).error);
        const deletion = await db.auth.admin.deleteUser(job.owner_id);
        if (deletion.error && deletion.error.code !== "user_not_found")
          check(deletion.error);
        check(
          (
            await db
              .from("deletion_ledger")
              .update({ completed_at: new Date().toISOString() })
              .eq("owner_id", job.owner_id)
          ).error,
        );
      } else if (job.kind === "export") {
        const { data: profile } = await db
          .from("parent_profiles")
          .select("status")
          .eq("user_id", job.owner_id)
          .single();
        if (profile?.status !== "active")
          throw new AppError("Account unavailable");
        const result: Record<string, unknown> = {
          exported_at: new Date().toISOString(),
        };
        for (const table of [
          "child_profiles",
          "threads",
          "messages",
          "memory_items",
          "journal_entries",
          "consent_events",
        ]) {
          const rows: unknown[] = [];
          for (let offset = 0; ; offset += 500) {
            const { data, error } = await db
              .from(table)
              .select("*")
              .eq("owner_id", job.owner_id)
              .order(table === "child_profiles" ? "owner_id" : "id")
              .range(offset, offset + 499);
            check(error);
            rows.push(...(data ?? []));
            if (Buffer.byteLength(JSON.stringify(rows)) > 9000000)
              throw new AppError("Export needs operator assistance");
            if (!data || data.length < 500) break;
          }
          result[table] = rows;
        }
        const bytes = JSON.stringify(result, null, 2);
        if (Buffer.byteLength(bytes) > 10000000)
          throw new AppError("Export needs operator assistance");
        const path = job.owner_id + "/" + job.target_id + ".json";
        check(
          (
            await db.storage.from("parent-exports").upload(path, bytes, {
              contentType: "application/json",
              upsert: true,
            })
          ).error,
        );
        const { data: stillActive } = await db
          .from("parent_profiles")
          .select("status")
          .eq("user_id", job.owner_id)
          .single();
        if (stillActive?.status !== "active") {
          await db.storage.from("parent-exports").remove([path]);
          throw new AppError("Account unavailable");
        }
        check(
          (
            await db
              .from("export_requests")
              .update({
                object_path: path,
                expires_at: new Date(Date.now() + 86400000).toISOString(),
              })
              .eq("id", job.target_id)
          ).error,
        );
      } else if (job.kind === "index-source") {
        const { data: source } = await db
          .from("knowledge_sources")
          .select("*")
          .eq("id", job.target_id)
          .eq("state", "indexing")
          .single();
        if (!source) throw new AppError("Source unavailable");
        check(
          (
            await db
              .from("knowledge_chunks")
              .delete()
              .eq("source_id", source.id)
          ).error,
        );
        check(
          (
            await db.from("knowledge_chunks").insert(
              chunkText(source.text).map((text) => ({
                source_id: source.id,
                text,
                version: source.version,
              })),
            )
          ).error,
        );
        check(
          (
            await db
              .from("knowledge_sources")
              .update({ state: "published" })
              .eq("id", source.id)
              .eq("state", "indexing")
          ).error,
        );
      } else if (job.kind === "evaluation") {
        const { data: run } = await db
          .from("evaluation_runs")
          .select("*")
          .eq("id", job.target_id)
          .single();
        if (!run) throw new AppError("Evaluation unavailable");
        const { data: config } = await db
          .from("ai_config_versions")
          .select("*")
          .eq("id", run.config_id)
          .single();
        if (!config) throw new AppError("Config unavailable");
        const results = run.results ?? [];
        const evaluationPolicy =
          SYSTEM_POLICY + responsePolicy(config.response_style);
        for (const test of evaluationCases.slice(
          results.length,
          results.length + 2,
        )) {
          const id = randomUUID(),
            reservation = reserveCost(
              Buffer.byteLength(evaluationPolicy + test.prompt),
              400,
              Number(config.input_rate),
              Number(config.output_rate),
            );
          check(
            (
              await db.rpc("reserve_operation", {
                u: job.owner_id,
                r: id,
                model: config.model_id,
                reserve_cost: reservation,
              })
            ).error,
          );
          let result;
          try {
            result = await generateText({
              ...modelOptions(config),
              system: evaluationPolicy,
              prompt: test.prompt,
              maxOutputTokens: 400,
              abortSignal: AbortSignal.timeout(18000),
            });
          } finally {
            const usage = result?.usage;
            await db.rpc("finish_turn", {
              u: job.owner_id,
              t: null,
              r: id,
              answer: "",
              cost: usage
                ? reserveCost(
                    usage.inputTokens ?? 0,
                    usage.outputTokens ?? 0,
                    Number(config.input_rate),
                    Number(config.output_rate),
                  )
                : reservation,
              in_tokens: usage?.inputTokens ?? 0,
              out_tokens: usage?.outputTokens ?? 0,
              cfg: config.id,
              refs: [],
              end_status: result ? "completed" : "failed",
            });
          }
          results.push({
            id: test.id,
            prompt: test.prompt,
            answer: result.text,
          });
          check(
            (
              await db
                .from("evaluation_runs")
                .update({
                  results,
                  state:
                    results.length === evaluationCases.length
                      ? "completed"
                      : "running",
                })
                .eq("id", run.id)
            ).error,
          );
        }
        requeue = results.length < evaluationCases.length;
      }
      check(
        (
          await db
            .from("jobs")
            .update({
              state: requeue ? "queued" : "completed",
              lease_until: null,
              ...(requeue
                ? { attempts: 0, next_run: new Date().toISOString() }
                : {}),
            })
            .eq("id", job.id)
        ).error,
      );
    } catch {
      await db
        .from("jobs")
        .update({
          state: job.attempts >= 5 ? "failed" : "queued",
          lease_until: null,
          next_run: new Date(
            Date.now() + Math.min(3600, 30 * 2 ** job.attempts) * 1000,
          ).toISOString(),
        })
        .eq("id", job.id);
      return NextResponse.json({ processed: 1, retry: true });
    }
    return NextResponse.json({ processed: 1 });
  } catch (e) {
    return failure(e);
  }
}
