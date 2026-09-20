import { NextResponse } from "next/server";
import { z } from "zod";
import { admin, AppError, body, check, failure, origin } from "@/lib/server";
import { gateway } from "@/lib/gateway";
import { configSchema } from "@/lib/validation";
import { safeUrl } from "@/lib/ai-policy";
export async function GET() {
  try {
    const { privileged: db, role } = await admin(false);
    const [models, configs, sources, jobs, settings, active, evaluations] =
      await Promise.all([
        db.from("model_catalogue").select("*").order("name"),
        db
          .from("ai_config_versions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        db
          .from("knowledge_sources")
          .select("id,title,state,publisher,url,reviewer"),
        db
          .from("jobs")
          .select("id,kind,state,attempts")
          .order("created_at", { ascending: false })
          .limit(30),
        db.from("operating_settings").select("*").single(),
        db.from("active_config").select("config_id").single(),
        db
          .from("evaluation_runs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
    return NextResponse.json({
      models: role === "owner" ? (models.data ?? []) : [],
      configs: role === "owner" ? (configs.data ?? []) : [],
      sources: sources.data ?? [],
      jobs: role === "owner" ? (jobs.data ?? []) : [],
      settings:
        role === "owner" ? settings.data : { paused: true, monthly_budget: 0 },
      active: active.data?.config_id,
      evaluations: role === "owner" ? (evaluations.data ?? []) : [],
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    const b = await body(req);
    const { privileged: db, user } = await admin(
      !["save-source", "publish", "unpublish"].includes(b.action),
    );
    if (b.action === "refresh-models") {
      const catalogue = await gateway.getAvailableModels();
      const rows = catalogue.models.map((m) => ({
        id: m.id,
        name: m.name,
        metadata: JSON.parse(JSON.stringify(m)),
        fetched_at: new Date().toISOString(),
      }));
      check((await db.from("model_catalogue").upsert(rows)).error);
      return NextResponse.json({
        message: "Catalogue refreshed. No models were activated.",
      });
    }
    if (b.action === "create-config") {
      const c = configSchema.parse(b.config);
      if (c.fallback_id)
        throw new AppError(
          "Fallback configuration requires a separately approved route; use one model for this release.",
        );
      const { data: exists } = await db
        .from("model_catalogue")
        .select("id")
        .eq("id", c.model_id)
        .maybeSingle();
      if (!exists)
        throw new AppError(
          "Refresh the catalogue and select an available model.",
        );
      check(
        (
          await db
            .from("ai_config_versions")
            .insert({ ...c, created_by: user.id })
        ).error,
      );
    } else if (b.action === "evaluate") {
      const id = z.string().uuid().parse(b.id);
      const { data: run, error } = await db
        .from("evaluation_runs")
        .insert({ config_id: id })
        .select("id")
        .single();
      check(error);
      check(
        (
          await db
            .from("jobs")
            .insert({
              kind: "evaluation",
              owner_id: user.id,
              target_id: run!.id,
            })
        ).error,
      );
      return NextResponse.json({
        message:
          "Evaluation queued. Review the sample answers after it completes.",
      });
    } else if (b.action === "approve-evaluation") {
      const id = z.string().uuid().parse(b.id);
      const { data: run } = await db
        .from("evaluation_runs")
        .select("*")
        .eq("id", id)
        .single();
      if (run?.state !== "completed" || run.results.length !== 40)
        throw new AppError("Wait for all 40 test answers before review.");
      check(
        (
          await db
            .from("evaluation_runs")
            .update({
              state: "approved",
              reviewer: user.id,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", id)
        ).error,
      );
    } else if (b.action === "activate") {
      const id = z.string().uuid().parse(b.id);
      const { data: review } = await db
        .from("evaluation_runs")
        .select("id")
        .eq("config_id", id)
        .eq("state", "approved")
        .limit(1)
        .maybeSingle();
      if (!review)
        throw new AppError(
          "Complete the evaluations and human review before activating.",
        );
      check(
        (
          await db
            .from("active_config")
            .update({ config_id: id })
            .eq("singleton", true)
        ).error,
      );
    } else if (b.action === "save-source") {
      const s = z
        .object({
          title: z.string().min(1).max(200),
          publisher: z.string().min(1).max(200),
          url: z.string().refine(safeUrl),
          licence: z.string().min(1).max(1000),
          text: z.string().min(1).max(100000),
        })
        .strict()
        .parse(b.source);
      check((await db.from("knowledge_sources").insert(s)).error);
    } else if (b.action === "publish") {
      const id = z.string().uuid().parse(b.id),
        reviewer = z.string().trim().min(2).max(150).parse(b.reviewer);
      check(
        (
          await db
            .from("knowledge_sources")
            .update({
              state: "indexing",
              reviewer,
              reviewed_at: new Date().toISOString(),
              review_due: new Date(Date.now() + 90 * 86400000).toISOString(),
            })
            .eq("id", id)
        ).error,
      );
      check(
        (
          await db
            .from("jobs")
            .insert({ kind: "index-source", target_id: id, owner_id: user.id })
        ).error,
      );
      return NextResponse.json({
        message: "Review recorded. Publication will complete after indexing.",
      });
    } else if (b.action === "unpublish") {
      check(
        (
          await db
            .from("knowledge_sources")
            .update({ state: "draft" })
            .eq("id", z.string().uuid().parse(b.id))
        ).error,
      );
    } else if (b.action === "settings") {
      const s = z
        .object({
          monthly_budget: z.number().min(0).max(10000),
          paused: z.boolean(),
        })
        .parse(b);
      check(
        (await db.from("operating_settings").update(s).eq("singleton", true))
          .error,
      );
    } else if (b.action === "retry-job") {
      check(
        (
          await db
            .from("jobs")
            .update({
              state: "queued",
              attempts: 0,
              next_run: new Date().toISOString(),
            })
            .eq("id", z.string().uuid().parse(b.id))
            .eq("state", "failed")
        ).error,
      );
    } else throw new AppError("Unknown action.");
    check(
      (
        await db
          .from("audit_events")
          .insert({
            actor_id: user.id,
            action: b.action,
            target_id: b.id ?? null,
          })
      ).error,
    );
    return NextResponse.json({ message: "Saved." });
  } catch (e) {
    return failure(e);
  }
}
