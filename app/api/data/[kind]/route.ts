import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AppError,
  body,
  check,
  failure,
  identity,
  origin,
  requirePilotAccess,
  service,
} from "@/lib/server";
import { childSchema, noteSchema } from "@/lib/validation";
import { brand } from "@/lib/brand";
async function handle(
  req: Request,
  context: { params: Promise<{ kind: string }> },
) {
  try {
    origin(req);
    const { kind } = await context.params,
      b = await body(req),
      { db, user } = await identity(kind !== "consent");
    let result;
    if (kind === "consent") {
      if (b.accepted !== true)
        throw new AppError("Please review the consent statement.");
      await requirePilotAccess(user);
      const svc = service();
      check(
        (
          await svc
            .from("consent_events")
            .insert({
              owner_id: user.id,
              version: brand.policyVersion,
              accepted: true,
            })
        ).error,
      );
      check(
        (
          await svc
            .from("parent_profiles")
            .update({
              consent_version: brand.policyVersion,
              consent_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        ).error,
      );
      return NextResponse.json({ ok: true });
    }
    if (kind === "child") {
      if (req.method === "DELETE")
        result = await db
          .from("child_profiles")
          .delete()
          .eq("owner_id", user.id);
      else
        result = await db
          .from("child_profiles")
          .upsert({ ...childSchema.parse(b), owner_id: user.id });
    } else if (kind === "thread") {
      if (req.method === "DELETE")
        result = await db
          .from("threads")
          .delete()
          .eq("id", z.string().uuid().parse(b.id))
          .eq("owner_id", user.id);
      else if (req.method === "PATCH") {
        const change = z
          .object({ id: z.string().uuid(), use_saved_context: z.boolean() })
          .strict()
          .parse(b);
        result = await db
          .from("threads")
          .update({ use_saved_context: change.use_saved_context })
          .eq("id", change.id)
          .eq("owner_id", user.id);
      } else {
        const value = z
          .object({ use_saved_context: z.boolean() })
          .strict()
          .parse(b);
        result = await db
          .from("threads")
          .insert({
            owner_id: user.id,
            use_saved_context: value.use_saved_context,
            title: "Conversation · " + new Date().toISOString().slice(0, 10),
          })
          .select("id")
          .single();
        check(result.error);
        return NextResponse.json(result.data);
      }
    } else if (kind === "memory" || kind === "journal") {
      const table = kind === "memory" ? "memory_items" : "journal_entries";
      if (req.method === "DELETE")
        result = await db
          .from(table)
          .delete()
          .eq("id", z.string().uuid().parse(b.id))
          .eq("owner_id", user.id);
      else {
        const n = noteSchema.parse(b);
        if (kind === "memory" && n.text.length > 1000)
          throw new AppError("Keep saved facts under 1,000 characters.");
        result = await db
          .from(table)
          .upsert({
            id: n.id,
            owner_id: user.id,
            text: n.text,
            ...(kind === "journal"
              ? { include_in_ai: n.include_in_ai ?? false }
              : { source_thread_id: n.source_thread_id ?? null }),
          });
      }
    } else throw new AppError("Unknown action.", 404);
    check(result.error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
