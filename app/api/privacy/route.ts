import { NextResponse } from "next/server";
import {
  AppError,
  body,
  check,
  failure,
  identity,
  origin,
  recentLogin,
  service,
} from "@/lib/server";
export async function GET(req: Request) {
  try {
    const { db, user } = await identity();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      const { data, error } = await db
        .from("export_requests")
        .select("id,expires_at,created_at,object_path")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      check(error);
      return NextResponse.json({
        exports: (data ?? []).map(({ object_path, ...r }) => ({
          ...r,
          ready: !!object_path,
        })),
      });
    }
    await recentLogin(db);
    const { data: ex } = await db
      .from("export_requests")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (!ex?.object_path)
      throw new AppError("This export is not ready or has expired.", 404);
    const { data, error } = await service()
      .storage.from("parent-exports")
      .download(ex.object_path);
    check(error);
    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="alongside-export.json"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    origin(req);
    const { db, user } = await identity(false);
    await recentLogin(db);
    const b = await body(req),
      svc = service();
    if (b.action === "delete-account") {
      check((await svc.rpc("request_deletion", { u: user.id })).error);
      await db.auth.signOut({ scope: "global" });
      return NextResponse.json({
        message: "Access removed. Account cleanup has been queued.",
      });
    }
    if (b.action === "export") {
      const { count } = await svc
        .from("export_requests")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .gte("created_at", new Date(Date.now() - 86400000).toISOString());
      if ((count ?? 0) >= 2)
        throw new AppError("You can request two exports each day.", 429);
      const { data: ex, error } = await svc
        .from("export_requests")
        .insert({ owner_id: user.id })
        .select("id")
        .single();
      check(error);
      check(
        (
          await svc
            .from("jobs")
            .insert({ kind: "export", owner_id: user.id, target_id: ex!.id })
        ).error,
      );
      return NextResponse.json({
        message: "Export requested. Refresh this page shortly to download it.",
      });
    }
    throw new AppError("Unknown action.");
  } catch (e) {
    return failure(e);
  }
}
