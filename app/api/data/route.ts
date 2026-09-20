import { NextResponse } from "next/server";
import { check, failure, identity, service } from "@/lib/server";
import { emptyChild } from "@/lib/types";
export async function GET() {
  try {
    const { db, user, profile } = await identity(false);
    const member = await service()
      .from("admin_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle();
    check(member.error);
    if (!profile.consent_at)
      return NextResponse.json({
        child: emptyChild,
        memories: [],
        journal: [],
        threads: [],
        email: user.email,
        consent: false,
        isAdmin: !!member.data,
        adminRole: member.data?.role,
      });
    const [child, memories, journal, threads] = await Promise.all([
      db
        .from("child_profiles")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle(),
      db
        .from("memory_items")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("journal_entries")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("threads")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    for (const r of [child, memories, journal, threads, member]) check(r.error);
    const ids = (threads.data ?? []).map((t) => t.id);
    const messages: any[] = [];
    // Page the selected conversations instead of silently cutting off the newest
    // messages after a user's first 1,000 messages.
    if (ids.length)
      for (let start = 0; ; start += 500) {
        const r = await db
          .from("messages")
          .select("*")
          .eq("owner_id", user.id)
          .in("thread_id", ids)
          .order("created_at")
          .order("id")
          .range(start, start + 499);
        check(r.error);
        messages.push(...(r.data ?? []));
        if (!r.data || r.data.length < 500) break;
      }
    return NextResponse.json({
      child: child.data ?? emptyChild,
      memories: memories.data ?? [],
      journal: journal.data ?? [],
      threads: (threads.data ?? []).map((t) => ({
        ...t,
        messages: messages.filter((m) => m.thread_id === t.id),
      })),
      email: user.email,
      consent: true,
      isAdmin: !!member.data,
      adminRole: member.data?.role,
    });
  } catch (e) {
    return failure(e);
  }
}
