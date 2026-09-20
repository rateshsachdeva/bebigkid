"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  HeartHandshake,
  History,
  Leaf,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyChild,
  emptySnapshot,
  type Child,
  type Note,
  type Snapshot,
  type Source,
  type Thread,
} from "@/lib/types";
import Admin from "./admin";

const starters = [
  {
    icon: Heart,
    title: "A difficult moment",
    text: "Let’s take it one step at a time.",
    prompt:
      "We’re having a difficult moment and I need help thinking through what to do.",
  },
  {
    icon: BookOpen,
    title: "School & routines",
    text: "Make everyday transitions easier.",
    prompt: "I’d like help with school routines and transitions.",
  },
  {
    icon: MessageCircle,
    title: "Understanding my child",
    text: "Explore communication and sensory needs.",
    prompt: "I want to understand what my child might be communicating.",
  },
  {
    icon: Leaf,
    title: "A little support for me",
    text: "There’s room for your feelings, too.",
    prompt: "I’m feeling overwhelmed as a parent and could use some support.",
  },
];
const sample: Snapshot = {
  ...emptySnapshot,
  consent: true,
  child: {
    ...emptyChild,
    nickname: "Alex",
    age_years: 9,
    communication: "Prefers short, clear sentences and time to respond.",
    sensory: "Loud, unexpected sounds can be uncomfortable.",
    interests: "Drawing and trains.",
  },
  memories: [
    {
      id: "sample-memory",
      text: "A written plan makes new activities feel more predictable.",
      created_at: "2026-09-20T09:00:00Z",
    },
  ],
  journal: [],
  threads: [],
};
export async function api(path: string, body?: unknown, method?: string) {
  const response = await fetch(path, {
    method: method ?? (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export default function Workspace({
  demo = false,
  initialPage = "chat",
}: {
  demo?: boolean;
  initialPage?: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage),
    [data, setData] = useState<Snapshot>(
      demo ? structuredClone(sample) : emptySnapshot,
    ),
    [ready, setReady] = useState(demo),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [draft, setDraft] = useState(""),
    [current, setCurrent] = useState<string | null>(
      initialPage.startsWith("chat/") ? initialPage.split("/")[1] : null,
    ),
    [context, setContext] = useState(true),
    [busy, setBusy] = useState(false),
    [online, setOnline] = useState(true),
    [history, setHistory] = useState(false);
  const [editor, setEditor] = useState<{
      kind: "memory" | "journal";
      note?: Note;
      source?: string;
    } | null>(null),
    [noteText, setNoteText] = useState(""),
    [includeNote, setIncludeNote] = useState(false),
    [confirm, setConfirm] = useState<{
      title: string;
      description: string;
      action: () => Promise<void>;
    } | null>(null),
    [sources, setSources] = useState<Source[] | null>(null);
  const [exports, setExports] = useState<{ id: string; ready: boolean }[]>([]);
  const [child, setChild] = useState<Child>(data.child),
    [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [codeSent, setCodeSent] = useState(false),
    [resendAt, setResendAt] = useState(0),
    [accepted, setAccepted] = useState(false);
  const controller = useRef<AbortController | null>(null),
    bottom = useRef<HTMLDivElement>(null),
    composer = useRef<HTMLTextAreaElement>(null);
  const active = data.threads.find((t) => t.id === current);
  const rootPage = page.split("/")[0];
  const publicPage = ["sign-in", "help", "privacy", "terms"].includes(page);
  const go = (p: string) => {
    setError("");
    setNotice("");
    setHistory(false);
    if (demo) {
      setPage(p);
    } else router.push("/" + p);
  };
  async function refresh() {
    const snapshot = await api("/api/data");
    setData(snapshot);
    setChild(snapshot.child);
    setReady(true);
    return snapshot as Snapshot;
  }
  useEffect(() => {
    setPage(initialPage);
  }, [initialPage]);
  useEffect(() => {
    if (demo || publicPage) return;
    refresh()
      .then((d) => {
        if (!d.consent && initialPage !== "welcome") router.replace("/welcome");
      })
      .catch((e) => {
        setError(e.message);
        setReady(true);
      });
  }, [demo, initialPage]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [active?.messages.length, busy]);
  async function mutate(kind: string, body: unknown, method = "POST") {
    setError("");
    return api("/api/data/" + kind, body, method);
  }
  async function saveNote() {
    if (!editor || !noteText.trim()) return;
    setBusy(true);
    try {
      const note: Note = {
        id: editor.note?.id ?? crypto.randomUUID(),
        text: noteText.trim(),
        created_at: editor.note?.created_at ?? new Date().toISOString(),
        include_in_ai: includeNote,
        source_thread_id: editor.source ?? editor.note?.source_thread_id,
      };
      if (demo) {
        const key = editor.kind === "memory" ? "memories" : "journal";
        setData((d) => ({
          ...d,
          [key]: [note, ...d[key].filter((n) => n.id !== note.id)],
        }));
      } else {
        await mutate(editor.kind, note);
        await refresh();
      }
      setEditor(null);
      setNotice("Saved. You can change or remove this whenever you like.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function editNote(kind: "memory" | "journal", note?: Note, source?: string) {
    setNoteText(note?.text ?? "");
    setIncludeNote(note?.include_in_ai ?? false);
    setEditor({ kind, note, source });
  }
  function removeNote(kind: "memory" | "journal", note: Note) {
    setConfirm({
      title: "Remove this " + kind + "?",
      description:
        "It will no longer be used as saved context. Existing conversation messages are not changed.",
      action: async () => {
        if (demo) {
          const key = kind === "memory" ? "memories" : "journal";
          setData((d) => ({
            ...d,
            [key]: d[key].filter((n) => n.id !== note.id),
          }));
        } else {
          await mutate(kind, { id: note.id }, "DELETE");
          await refresh();
        }
        setNotice("Removed.");
      },
    });
  }
  async function saveChild(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (demo) setData((d) => ({ ...d, child }));
      else {
        await mutate("child", child);
        await refresh();
      }
      setNotice("Your child’s profile has been saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function newChat() {
    controller.current?.abort();
    setCurrent(null);
    setDraft("");
    setContext(true);
    go("chat");
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (busy || !draft.trim() || !online) return;
    const text = draft.trim();
    setError("");
    setBusy(true);
    setDraft("");
    let thread = active;
    try {
      if (!thread) {
        const id = demo
          ? crypto.randomUUID()
          : (await mutate("thread", { use_saved_context: context })).id;
        thread = {
          id,
          title: "Conversation · " + new Date().toLocaleDateString(),
          created_at: new Date().toISOString(),
          use_saved_context: context,
          messages: [],
        };
        setData((d) => ({ ...d, threads: [thread!, ...d.threads] }));
        setCurrent(id);
      }
      const tid = thread.id,
        mid = crypto.randomUUID();
      setData((d) => ({
        ...d,
        threads: d.threads.map((t) =>
          t.id === tid
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { id: mid, role: "user", content: text },
                ],
              }
            : t,
        ),
      }));
      if (demo) {
        setData((d) => ({
          ...d,
          threads: d.threads.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  messages: [
                    ...t.messages,
                    {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content:
                        "This is a sample conversation, not a live AI response.\n\nIn the connected app, your assistant will respond to your question using only the context you choose to share. You can explore the child profile, journal and memory controls here. Nothing in this sample is saved when you reload.",
                    },
                  ],
                }
              : t,
          ),
        }));
        return;
      }
      controller.current = new AbortController();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: tid, message: text, requestId: mid }),
        signal: controller.current.signal,
      });
      if (!response.ok) {
        const er = await response.json();
        throw new Error(er.error ?? "The reply could not begin.");
      }
      const aid = crypto.randomUUID();
      setData((d) => ({
        ...d,
        threads: d.threads.map((t) =>
          t.id === tid
            ? {
                ...t,
                messages: [
                  ...t.messages,
                  { id: aid, role: "assistant", content: "" },
                ],
              }
            : t,
        ),
      }));
      const reader = response.body!.getReader(),
        decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        answer += decoder.decode(chunk.value, { stream: true });
        const content = answer;
        setData((d) => ({
          ...d,
          threads: d.threads.map((t) =>
            t.id === tid
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === aid ? { ...m, content } : m,
                  ),
                }
              : t,
          ),
        }));
      }
      await refresh();
    } catch (e) {
      if ((e as Error).name === "AbortError") setNotice("Reply stopped.");
      else {
        setError((e as Error).message);
        if (!demo) refresh().catch(() => {});
        setDraft(text);
      }
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }
  async function toggleContext(value: boolean) {
    setContext(value);
    if (active) {
      if (demo)
        setData((d) => ({
          ...d,
          threads: d.threads.map((t) =>
            t.id === current ? { ...t, use_saved_context: value } : t,
          ),
        }));
      else
        try {
          await mutate(
            "thread",
            { id: current, use_saved_context: value },
            "PATCH",
          );
          await refresh();
        } catch (e) {
          setError((e as Error).message);
        }
    }
  }
  function deleteThread(t: Thread) {
    setConfirm({
      title: "Delete this conversation?",
      description:
        "Its messages and any memories saved from it will be removed. This cannot be undone.",
      action: async () => {
        controller.current?.abort();
        if (demo)
          setData((d) => ({
            ...d,
            threads: d.threads.filter((x) => x.id !== t.id),
            memories: d.memories.filter((n) => n.source_thread_id !== t.id),
          }));
        else {
          await mutate("thread", { id: t.id }, "DELETE");
          await refresh();
        }
        if (current === t.id) setCurrent(null);
        setNotice("Conversation and linked memories deleted.");
      },
    });
  }
  async function auth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        "/api/auth",
        codeSent
          ? { action: "verify", email, code }
          : { action: "send", email },
      );
      if (codeSent) window.location.assign("/chat");
      else {
        setCodeSent(true);
        setResendAt(Date.now() + 60000);
        setNotice("Check your email for your sign-in code.");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const alert = (
    <>
      {error && (
        <div className="feedback error" role="alert">
          {error}
          {error.includes("Sign in") && (
            <button onClick={() => go("sign-in")}>Sign in</button>
          )}
        </div>
      )}
      {notice && (
        <div className="feedback success" role="status">
          {notice}
        </div>
      )}
      {!online && (
        <div className="feedback" role="status">
          You’re offline. Reconnect to send a message.
        </div>
      )}
    </>
  );
  const pageHead = (label: string, title: string, subtitle: string) => (
    <div className="page-heading">
      <span className="eyebrow">{label}</span>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
  const navs = [
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "journal", label: "Journal", icon: NotebookPen },
    { id: "child", label: "My child", icon: UserRound },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <HeartHandshake />
          alongside<span className="brand-dot">.</span>
        </Link>
        <Button className="new-chat" onClick={newChat}>
          <Plus size={18} />
          New conversation
        </Button>
        <nav aria-label="Main navigation">
          {navs.map((n) => (
            <button
              key={n.id}
              className={rootPage === n.id ? "nav-item active" : "nav-item"}
              onClick={() => go(n.id)}
            >
              <n.icon size={20} />
              {n.label}
              {rootPage === n.id && <span className="nav-marker" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-rule" />
        <div className="sidebar-caption">YOUR SPACE</div>
        <button className="nav-item" onClick={() => go("settings/memory")}>
          <Sparkles size={19} />
          What we remember<span className="count">{data.memories.length}</span>
        </button>
        <button className="nav-item" onClick={() => setHistory(true)}>
          <History size={19} />
          Conversations
        </button>
        {(data.isAdmin || demo) && (
          <button className="nav-item" onClick={() => go("admin")}>
            <SlidersHorizontal size={19} />
            Owner dashboard
          </button>
        )}
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <LockKeyhole size={18} />
            <p>
              Your story is yours.
              <br />
              <button onClick={() => go("settings/privacy")}>
                Manage your privacy
              </button>
            </p>
          </div>
          <button
            className="account-row"
            onClick={() => go("settings/account")}
          >
            <span className="avatar">{demo ? "S" : "P"}</span>
            <span>
              {demo ? "Sample parent" : "Your account"}
              <small>
                {demo ? "Explore at your own pace" : "Account & preferences"}
              </small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-only icon-button"
            aria-label="Open conversations"
            onClick={() => setHistory(true)}
          >
            <Menu size={21} />
          </button>
          <span className="breadcrumb">
            Your space <ChevronRight size={14} />
            <strong>
              {rootPage === "child"
                ? "My child"
                : rootPage === "settings"
                  ? "Settings"
                  : rootPage === "admin"
                    ? "Owner dashboard"
                    : rootPage === "journal"
                      ? "Journal"
                      : "Conversation"}
            </strong>
          </span>
          <button className="help-button" onClick={() => go("help")}>
            <CircleHelp size={18} />
            <span>Help & support</span>
          </button>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              Sample experience · fictional details · changes disappear on
              reload
            </span>
            <Link href="/sign-in">
              Sign in <ArrowUpRightIcon />
            </Link>
          </div>
        )}
        {publicPage ? (
          <div className="content-page">
            {page === "sign-in" ? (
              <div className="auth-panel">
                {pageHead(
                  "WELCOME TO ALONGSIDE",
                  "A space for you.",
                  "Sign in with an email code. No password to remember.",
                )}
                <form onSubmit={auth}>
                  <label>
                    Email address
                    <Input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={codeSent}
                    />
                  </label>
                  {codeSent && (
                    <label>
                      Sign-in code
                      <Input
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        minLength={6}
                        maxLength={10}
                      />
                    </label>
                  )}
                  <Button className="primary-button" disabled={busy}>
                    {busy
                      ? "Please wait…"
                      : codeSent
                        ? "Continue"
                        : "Send a sign-in code"}
                    <ArrowRight size={17} />
                  </Button>
                </form>
                {codeSent && (
                  <button
                    className="text-link"
                    onClick={() => {
                      if (Date.now() < resendAt) {
                        setNotice(
                          "Please wait a minute before requesting another code.",
                        );
                        return;
                      }
                      setCodeSent(false);
                      setCode("");
                    }}
                  >
                    Use a different email or request another code
                  </button>
                )}
                {alert}
                <p className="small-print">
                  Invitation-only pilot. Your email is used for account access.
                </p>
              </div>
            ) : (
              <>
                <button className="back-link" onClick={() => go("chat")}>
                  <ArrowLeft size={16} />
                  Back to your space
                </button>
                {pageHead(
                  "ALONGSIDE",
                  page === "help"
                    ? "Support, with clear boundaries."
                    : page === "privacy"
                      ? "Your privacy matters."
                      : "Using Alongside.",
                  "Please read this before sharing personal information.",
                )}
                <div className="paper readable">
                  {page === "help" ? (
                    <>
                      <h2>If someone is in immediate danger</h2>
                      <p>
                        Contact your local emergency services or a trusted
                        person nearby. Alongside is not an emergency service,
                        and nobody monitors these conversations live.
                      </p>
                      <h2>What the assistant can help with</h2>
                      <p>
                        Thinking through everyday routines, communication,
                        sensory preferences and your experience as a parent. It
                        can be wrong and cannot diagnose or prescribe treatment.
                      </p>
                      <h2>When you need more support</h2>
                      <p>
                        Contact a qualified professional for medical concerns,
                        new symptoms or decisions about treatment. Your
                        knowledge of your child matters.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="review-label">
                        Pre-release notice · final review pending
                      </div>
                      <h2>
                        {page === "privacy"
                          ? "What happens to your information"
                          : "Who this service is for"}
                      </h2>
                      <p>
                        This service is intended for adult parents and
                        authorised caregivers. Share only what you are
                        comfortable sharing. A child’s nickname and age are
                        enough.
                      </p>
                      <p>
                        Conversations are private from other users. The
                        application and selected AI services process relevant
                        information to generate responses. This is not
                        end-to-end encryption or a promise that the operator can
                        never access data.
                      </p>
                      <p>
                        Saved conversations remain until you delete them. You
                        can edit memories, export your information and request
                        account deletion. Backups and AI providers may follow
                        separate retention schedules.
                      </p>
                      <p>
                        The operator identity, support contact and verified
                        provider retention details must be finalised before the
                        real-family pilot opens.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ) : page === "welcome" ? (
          <div className="content-page narrow">
            {pageHead(
              "BEFORE WE BEGIN",
              "Share at your own pace.",
              "You can start without completing a child profile.",
            )}
            <div className="paper">
              <LockKeyhole className="section-icon" />
              <h2>You stay in control</h2>
              <p>
                Your messages are saved in your account. Our application and
                selected AI providers process relevant information to answer
                you. Saved memories are always your choice.
              </p>
              <p>
                This assistant can make mistakes. It is not a therapist, medical
                service or emergency response team.
              </p>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                I am 18 or older, am authorised to share information about this
                child, and agree to the stated processing and{" "}
                <Link href="/privacy">privacy notice</Link>.
              </label>
              <Button
                className="primary-button"
                disabled={!accepted || busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    if (!demo) {
                      await mutate("consent", { accepted: true });
                      await refresh();
                    }
                    go("chat");
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Start chatting <ArrowRight size={17} />
              </Button>
            </div>
            {alert}
          </div>
        ) : rootPage === "admin" ? (
          <Admin demo={demo} />
        ) : !ready ? (
          <div className="content-page" role="status">
            Opening your space…
          </div>
        ) : rootPage === "chat" ? (
          <div className="chat-layout">
            <div className="chat-scroll">
              {!active?.messages.length ? (
                <section className="chat-welcome">
                  <div className="welcome-mark">
                    <HeartHandshake size={30} strokeWidth={1.4} />
                  </div>
                  <div className="eyebrow">A LITTLE SPACE TO BREATHE</div>
                  <h1>
                    What’s on your
                    <br />
                    <em>mind today?</em>
                  </h1>
                  <p>
                    Big worries, small questions, or just a moment to talk.
                    <br className="desktop-only" /> Start wherever you are.
                  </p>
                  <div className="starter-grid">
                    {starters.map((s) => (
                      <button
                        key={s.title}
                        className="starter"
                        onClick={() => {
                          setDraft(s.prompt);
                          composer.current?.focus();
                        }}
                      >
                        <s.icon size={22} strokeWidth={1.5} />
                        <strong>{s.title}</strong>
                        <span>{s.text}</span>
                        <ArrowRight className="starter-arrow" size={17} />
                      </button>
                    ))}
                  </div>
                  <div className="context-hint">
                    <Sparkles size={16} />
                    {data.child.nickname ? (
                      <>
                        Using the context you choose to share{" "}
                        <button onClick={() => go("settings/memory")}>
                          Review it
                        </button>
                      </>
                    ) : (
                      <>
                        A little context can help.{" "}
                        <button onClick={() => go("child")}>
                          Add an optional profile
                        </button>
                      </>
                    )}
                  </div>
                </section>
              ) : (
                <div className="messages">
                  <div className="thread-heading">
                    <span>{active.title}</span>
                    <button
                      className="icon-button"
                      aria-label="Delete conversation"
                      onClick={() => deleteThread(active)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  {active.messages.map((m) => (
                    <article key={m.id} className={"message " + m.role}>
                      <div className="message-label">
                        {m.role === "assistant" ? (
                          <>
                            <HeartHandshake size={19} />
                            Alongside
                          </>
                        ) : (
                          "You"
                        )}
                      </div>
                      <div className="message-content">
                        {m.content || "Thinking through your question…"}
                      </div>
                      {m.role === "assistant" && m.content && (
                        <div className="message-actions">
                          <button
                            onClick={() =>
                              editNote("memory", undefined, active.id)
                            }
                          >
                            <Plus size={14} />
                            Save a fact
                          </button>
                          {!!m.citations?.length && (
                            <button onClick={() => setSources(m.citations!)}>
                              <BookOpen size={14} />
                              Sources ({m.citations.length})
                            </button>
                          )}
                        </div>
                      )}
                      {m.status === "interrupted" && (
                        <p className="small-print">
                          This reply was interrupted. You can send your question
                          again.
                        </p>
                      )}
                    </article>
                  ))}
                  <div ref={bottom} />
                </div>
              )}
            </div>
            <div className="composer-region">
              {alert}
              <form className="composer" onSubmit={send}>
                <Textarea
                  ref={composer}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Tell me what’s happening…"
                  aria-label="Your message"
                  maxLength={8000}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      if (!busy && draft.trim())
                        e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className="composer-tools">
                  <label className="context-control">
                    <Switch
                      checked={active?.use_saved_context ?? context}
                      onCheckedChange={toggleContext}
                      disabled={busy}
                    />
                    Use my saved context
                  </label>
                  {busy ? (
                    <Button
                      type="button"
                      size="icon"
                      className="send"
                      aria-label="Stop response"
                      onClick={() => controller.current?.abort()}
                    >
                      <Square size={17} />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon"
                      className="send"
                      aria-label="Send message"
                      disabled={!draft.trim() || !online}
                    >
                      <ArrowUp size={20} />
                    </Button>
                  )}
                </div>
              </form>
              {!(active?.use_saved_context ?? context) && (
                <p className="small-print">
                  Saved context is off. This conversation is still saved in your
                  history.
                </p>
              )}
              <p className="composer-footer">
                <LockKeyhole size={12} />
                Share only what feels right. AI can make mistakes.
              </p>
            </div>
          </div>
        ) : rootPage === "child" ? (
          <div className="content-page narrow">
            {pageHead(
              "MY CHILD",
              "A little understanding\ngoes a long way.",
              "Only share what feels useful. You can change this at any time.",
            )}
            <form className="paper profile-form" onSubmit={saveChild}>
              <div className="two-columns">
                <label>
                  Nickname
                  <Input
                    value={child.nickname}
                    maxLength={40}
                    placeholder="A nickname is enough"
                    onChange={(e) =>
                      setChild({ ...child, nickname: e.target.value })
                    }
                  />
                </label>
                <label>
                  Age in years
                  <Input
                    type="number"
                    min={0}
                    max={25}
                    value={child.age_years ?? ""}
                    onChange={(e) =>
                      setChild({
                        ...child,
                        age_years: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </label>
              </div>
              {(
                [
                  {
                    key: "communication",
                    label: "How does your child like to communicate?",
                    placeholder: "Words, gestures, pictures, a device…",
                  },
                  {
                    key: "sensory",
                    label: "What feels comfortable or difficult?",
                    placeholder: "Sounds, textures, busy places, quiet spaces…",
                  },
                  {
                    key: "interests",
                    label: "What do they enjoy?",
                    placeholder: "Their favourite activities, topics or things",
                  },
                  {
                    key: "concerns",
                    label: "What’s on your mind at the moment?",
                    placeholder: "Anything you’d like support with",
                  },
                ] as const
              ).map((f) => (
                <label key={f.key}>
                  {f.label}
                  <Textarea
                    value={child[f.key]}
                    maxLength={1500}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setChild({ ...child, [f.key]: e.target.value })
                    }
                  />
                </label>
              ))}
              <div className="form-footer">
                <span>
                  <LockKeyhole size={14} />
                  Optional. Always editable.
                </span>
                <Button className="primary-button" disabled={busy}>
                  Save profile <Check size={16} />
                </Button>
              </div>
            </form>
            {alert}
          </div>
        ) : rootPage === "journal" || page === "settings/memory" ? (
          <div className="content-page narrow">
            {pageHead(
              rootPage === "journal" ? "YOUR JOURNAL" : "WHAT WE REMEMBER",
              rootPage === "journal"
                ? "The little things\nworth noting."
                : "You decide what\nstays with us.",
              rootPage === "journal"
                ? "A good day, a difficult moment, something that helped."
                : "Only the facts you choose to save. Nothing added silently.",
            )}
            <div className="section-toolbar">
              <span>
                {(rootPage === "journal" ? data.journal : data.memories).length}{" "}
                {rootPage === "journal" ? "notes" : "saved facts"}
              </span>
              <Button
                className="primary-button"
                onClick={() =>
                  editNote(rootPage === "journal" ? "journal" : "memory")
                }
              >
                <Plus size={17} />
                {rootPage === "journal" ? "Add a note" : "Save a fact"}
              </Button>
            </div>
            {(rootPage === "journal" ? data.journal : data.memories).length ===
            0 ? (
              <div className="paper empty-panel">
                <NotebookPen size={30} />
                <h2>
                  {rootPage === "journal"
                    ? "There’s no right way to begin."
                    : "Nothing saved yet."}
                </h2>
                <p>
                  {rootPage === "journal"
                    ? "One sentence is enough. Your notes are not used by the assistant unless you choose."
                    : "Add something you’d like the assistant to keep in mind for future conversations."}
                </p>
              </div>
            ) : (
              <div className="note-list">
                {(rootPage === "journal" ? data.journal : data.memories).map(
                  (n) => (
                    <article className="paper note-card" key={n.id}>
                      <div className="note-meta">
                        <span>
                          {new Date(n.created_at).toLocaleDateString(
                            undefined,
                            { day: "numeric", month: "long" },
                          )}
                        </span>
                        {rootPage === "journal" && (
                          <span className="tag">
                            {n.include_in_ai
                              ? "Included in saved context"
                              : "Just for your journal"}
                          </span>
                        )}
                      </div>
                      <p>{n.text}</p>
                      <div className="note-actions">
                        <button
                          onClick={() =>
                            editNote(
                              rootPage === "journal" ? "journal" : "memory",
                              n,
                            )
                          }
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            removeNote(
                              rootPage === "journal" ? "journal" : "memory",
                              n,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
            {alert}
          </div>
        ) : (
          <div className="content-page narrow">
            {pageHead(
              "YOUR SETTINGS",
              page === "settings/privacy"
                ? "Your information.\nYour choice."
                : page === "settings/account"
                  ? "Your account."
                  : "Make this space\nwork for you.",
              "Simple controls, whenever you need them.",
            )}
            <div className="paper settings-list">
              {page === "settings" ? (
                <>
                  {[
                    {
                      title: "What we remember",
                      body: "Review, edit or remove your saved facts.",
                      route: "settings/memory",
                      icon: Sparkles,
                    },
                    {
                      title: "Privacy & your data",
                      body: "Understand processing, export or delete.",
                      route: "settings/privacy",
                      icon: ShieldCheck,
                    },
                    {
                      title: "Your account",
                      body: "Sign-in and account access.",
                      route: "settings/account",
                      icon: UserRound,
                    },
                    {
                      title: "Help & support",
                      body: "What this assistant can and cannot do.",
                      route: "help",
                      icon: CircleHelp,
                    },
                  ].map((n) => (
                    <button
                      className="settings-item"
                      key={n.route}
                      onClick={() => go(n.route)}
                    >
                      <n.icon size={22} />
                      <span>
                        <strong>{n.title}</strong>
                        <small>{n.body}</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </>
              ) : page === "settings/privacy" ? (
                <>
                  <h2>Private from other users</h2>
                  <p>
                    The app and selected AI services process relevant
                    information to respond. Your conversations are not visible
                    to other parents.
                  </p>
                  <button
                    className="settings-item"
                    onClick={async () => {
                      try {
                        if (demo) {
                          const blob = new Blob(
                              [JSON.stringify(data, null, 2)],
                              { type: "application/json" },
                            ),
                            url = URL.createObjectURL(blob),
                            a = document.createElement("a");
                          a.href = url;
                          a.download = "alongside-sample.json";
                          a.click();
                          URL.revokeObjectURL(url);
                          setNotice("Sample information downloaded.");
                        } else {
                          const r = await api("/api/privacy", {
                            action: "export",
                          });
                          setNotice(r.message);
                        }
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    <NotebookPen size={21} />
                    <span>
                      <strong>Export my information</strong>
                      <small>Request a copy of your saved data.</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                  {!demo && (
                    <div className="export-list">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          try {
                            const r = await api("/api/privacy");
                            setExports(r.exports);
                            setNotice(
                              r.exports.length
                                ? "Export status updated."
                                : "No exports requested yet.",
                            );
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        Check my exports
                      </Button>
                      {exports.map((ex) => (
                        <div className="model-row" key={ex.id}>
                          {ex.ready ? (
                            <a
                              className="text-link"
                              href={"/api/privacy?id=" + ex.id}
                              download
                            >
                              Download my information
                            </a>
                          ) : (
                            <span>
                              Preparing your export. Check again shortly.
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className="settings-item"
                    onClick={() => go("privacy")}
                  >
                    <LockKeyhole size={21} />
                    <span>
                      <strong>Read the privacy notice</strong>
                      <small>How data is processed and retained.</small>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="settings-item danger"
                    onClick={() =>
                      setConfirm({
                        title: "Delete your account?",
                        description:
                          "Your conversations, profile, journal and memories will be removed. This cannot be undone. Backups follow their retention schedule.",
                        action: async () => {
                          if (demo) {
                            setData(structuredClone(emptySnapshot));
                            setChild(emptyChild);
                            setCurrent(null);
                            setNotice(
                              "Sample account cleared. Reload to reset the walkthrough.",
                            );
                          } else {
                            await api("/api/privacy", {
                              action: "delete-account",
                            });
                            window.location.assign("/");
                          }
                        },
                      })
                    }
                  >
                    <Trash2 size={21} />
                    <span>
                      <strong>Delete my account</strong>
                      <small>
                        Remove access immediately and begin cleanup.
                      </small>
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <h2>
                    {demo ? "Sample parent" : (data.email ?? "Your account")}
                  </h2>
                  <p>
                    {demo
                      ? "This sample has no real sign-in session."
                      : "You sign in using a code sent to your email."}
                  </p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      controller.current?.abort();
                      if (!demo) await api("/api/auth", { action: "logout" });
                      setData(emptySnapshot);
                      window.location.assign("/");
                    }}
                  >
                    <LogOut size={17} />
                    Sign out
                  </Button>
                </>
              )}
            </div>
            {alert}
          </div>
        )}
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navs.map((n) => (
          <button
            key={n.id}
            className={rootPage === n.id ? "active" : ""}
            onClick={() => go(n.id)}
          >
            <n.icon size={21} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      <Dialog open={history} onOpenChange={setHistory}>
        <DialogContent className="alongside-dialog">
          <DialogHeader>
            <DialogTitle>Your conversations</DialogTitle>
            <DialogDescription>
              Pick up a conversation, or begin again.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={newChat}>
            <Plus size={16} />
            New conversation
          </Button>
          <div className="history-list">
            {data.threads.length ? (
              data.threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setCurrent(t.id);
                    setContext(t.use_saved_context);
                    go("chat");
                    setHistory(false);
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{t.title}</span>
                  <ChevronRight size={16} />
                </button>
              ))
            ) : (
              <p>Your saved conversations will appear here.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editor}
        onOpenChange={(v) => {
          if (!v) setEditor(null);
        }}
      >
        <DialogContent className="alongside-dialog">
          <DialogHeader>
            <DialogTitle>
              {editor?.kind === "memory"
                ? "What would you like remembered?"
                : "A note for your journal"}
            </DialogTitle>
            <DialogDescription>
              {editor?.kind === "memory"
                ? "Save a short fact in your own words. You can change it later."
                : "There’s no right length. A sentence is enough."}
            </DialogDescription>
          </DialogHeader>
          <label className="sr-only" htmlFor="note-text">
            Note text
          </label>
          <Textarea
            id="note-text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={editor?.kind === "memory" ? 1000 : 4000}
            placeholder="Write here…"
            rows={5}
          />
          {editor?.kind === "journal" && (
            <label className="context-control">
              <Switch checked={includeNote} onCheckedChange={setIncludeNote} />
              Include this note in AI context
            </label>
          )}
          <Button onClick={saveNote} disabled={!noteText.trim() || busy}>
            Save {editor?.kind === "memory" ? "fact" : "note"}
          </Button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
      >
        <DialogContent className="alongside-dialog">
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await confirm?.action();
                  setConfirm(null);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Delete
            </Button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!sources}
        onOpenChange={(v) => {
          if (!v) setSources(null);
        }}
      >
        <DialogContent className="alongside-dialog">
          <DialogHeader>
            <DialogTitle>Sources for this reply</DialogTitle>
            <DialogDescription>
              Read the source and consider its relevance to your family.
            </DialogDescription>
          </DialogHeader>
          {sources?.map((s) => (
            <a
              key={s.id}
              className="source-link"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <strong>{s.title}</strong>
              <span>{s.publisher}</span>
            </a>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={14} />;
}
