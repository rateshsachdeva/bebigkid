"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { api } from "./workspace";

export default function Admin({ demo }: { demo: boolean }) {
  const [tab, setTab] = useState("overview"),
    [state, setState] = useState<any>({
      models: [],
      configs: [],
      evaluations: [],
      sources: [],
      jobs: [],
      settings: { paused: true, monthly_budget: 0 },
    }),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [model, setModel] = useState(""),
    [providers, setProviders] = useState(""),
    [inRate, setInRate] = useState(""),
    [outRate, setOutRate] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [source, setSource] = useState({
      title: "",
      publisher: "",
      url: "",
      licence: "",
      text: "",
    }),
    [reviewer, setReviewer] = useState(""),
    [budget, setBudget] = useState("0"),
    [code, setCode] = useState(""),
    [factor, setFactor] = useState(""),
    [qr, setQr] = useState("");
  async function load() {
    if (!demo) {
      const d = await api("/api/admin");
      setState(d);
      setBudget(String(d.settings?.monthly_budget ?? 0));
    }
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function action(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (demo) {
        setNotice(
          "Sample dashboard only. Live model, content and spending changes require an owner account.",
        );
        return;
      }
      const d = await api("/api/admin", body);
      setNotice(d.message ?? "Saved.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="content-page">
      <div className="page-heading">
        <span className="eyebrow">OWNER DASHBOARD</span>
        <h1>
          A little care,
          <br />
          behind the scenes.
        </h1>
        <p>
          Manage the assistant and its knowledge. Parent conversations are not
          shown here.
        </p>
      </div>
      <div className="admin-tabs">
        {["overview", "models", "knowledge", "operations"].map((t) => (
          <Button
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
            key={t}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>
      {error && (
        <div className="feedback error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="feedback success" role="status">
          {notice}
        </div>
      )}
      {error.includes("authenticator") && (
        <div className="paper admin-form">
          <h2>Verify owner access</h2>
          <p>
            If Alongside is already in your authenticator app, enter its current
            six-digit code below. Do not generate another QR code.
          </p>
          <p>
            For first-time setup, generate one QR code, scan it once, and then
            enter the code shown on your iPhone.
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const d = await api("/api/mfa", { action: "enrol" });
                setFactor(d.id);
                setQr(d.qr ?? "");
                setCode("");
                setNotice(
                  "Scan this QR code once. Then enter the current six-digit code shown for Alongside.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Preparing…" : "Generate a new QR code"}
          </Button>
          {qr && (
            <div>
              <img
                src={qr}
                width={180}
                height={180}
                alt="Authenticator setup QR code"
              />
              <p>
                On iPhone: scan with the Camera, choose <b>Add Verification
                Code</b> or open it in your authenticator app, and save the
                account as Alongside.
              </p>
            </div>
          )}
          <Input
            aria-label="Authenticator code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            maxLength={6}
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
          <Button
            disabled={busy || code.length !== 6}
            onClick={async () => {
              setBusy(true);
              setError("");
              setNotice("");
              try {
                await api("/api/mfa", { action: "verify", factor, code });
                setError("");
                setQr("");
                setNotice("Owner verification complete.");
                await load();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Verifying…" : "Verify code"}
          </Button>
        </div>
      )}
      {tab === "overview" ? (
        <>
          <div className="admin-grid">
            <div className="paper metric">
              <span>Assistant status</span>
              <strong>{state.settings.paused ? "Paused" : "Enabled"}</strong>
            </div>
            <div className="paper metric">
              <span>Monthly AI limit</span>
              <strong>${state.settings.monthly_budget}</strong>
            </div>
            <div className="paper metric">
              <span>Published sources</span>
              <strong>
                {
                  state.sources.filter((s: any) => s.state === "published")
                    .length
                }
              </strong>
            </div>
          </div>
          <div className="paper">
            <ShieldCheck size={25} />
            <h2>Start with a reviewed, private pilot.</h2>
            <p>
              Connect your dedicated database, review the assistant and
              knowledge, and configure limits before opening access to families.
            </p>
            <p>No parent transcripts are available in this dashboard.</p>
          </div>
        </>
      ) : tab === "models" ? (
        <div className="paper admin-form">
          <div className="section-toolbar">
            <h2>Choose the assistant</h2>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => action({ action: "refresh-models" })}
            >
              <RefreshCw size={16} />
              Refresh catalogue
            </Button>
          </div>
          <label>
            Available model
            <span>Catalogue refresh does not activate new models.</span>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="">Choose a supported model</option>
              {state.models.map((m: any) => (
                <option value={m.id} key={m.id}>
                  {m.name} · {m.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Approved hosting providers
            <span>
              Comma-separated provider IDs, verified against gateway
              documentation.
            </span>
            <Input
              value={providers}
              onChange={(e) => setProviders(e.target.value)}
            />
          </label>
          <div className="two-columns">
            <label>
              Input price / million tokens
              <Input
                type="number"
                min="0"
                step="any"
                value={inRate}
                onChange={(e) => setInRate(e.target.value)}
              />
            </label>
            <label>
              Output price / million tokens
              <Input
                type="number"
                min="0"
                step="any"
                value={outRate}
                onChange={(e) => setOutRate(e.target.value)}
              />
            </label>
          </div>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
            />
            I have reviewed provider privacy, pricing and behavioural
            suitability. This does not replace the evaluation gate.
          </label>
          <Button
            disabled={
              busy ||
              !model ||
              !providers ||
              inRate === "" ||
              outRate === "" ||
              !reviewed
            }
            onClick={() =>
              action({
                action: "create-config",
                config: {
                  model_id: model,
                  providers: providers
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                  input_rate: Number(inRate),
                  output_rate: Number(outRate),
                  output_tokens: 1200,
                  privacy_reviewed: true,
                  behaviour_reviewed: true,
                },
              })
            }
          >
            Save candidate configuration
          </Button>
          {state.configs.map((c: any) => (
            <div className="model-row" key={c.id}>
              <span>
                {c.model_id}
                <small>
                  {c.id === state.active
                    ? "Currently active"
                    : "Candidate / previous version"}
                </small>
              </span>
              <div className="dialog-actions">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => action({ action: "evaluate", id: c.id })}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  disabled={!reviewed}
                  onClick={() => action({ action: "activate", id: c.id })}
                >
                  Activate
                </Button>
              </div>
            </div>
          ))}
          {state.evaluations?.map((run: any) => (
            <details className="paper" key={run.id}>
              <summary>
                Evaluation · {run.state} · {run.results?.length ?? 0}/40 answers
              </summary>
              <p>Configuration: {run.config_id}</p>
              <p>
                A qualified reviewer must read all responses against the safety
                and usefulness criteria in docs/REVIEW_CHECKLIST.md. Completion
                alone is not a pass.
              </p>
              {run.results?.map((r: any) => (
                <article className="note-card" key={r.id}>
                  <h3>{r.id}</h3>
                  <p>{r.prompt}</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{r.answer}</p>
                </article>
              ))}
              <label>
                Reviewer name
                <Input
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                />
              </label>
              <Button
                disabled={busy || run.state !== "completed" || !reviewer.trim()}
                onClick={() =>
                  action({ action: "approve-evaluation", id: run.id, reviewer })
                }
              >
                I reviewed all 40 answers and approve
              </Button>
            </details>
          ))}
          <p className="small-print">
            A passed evaluation and human review are required to activate.
            Select a previously tested version to roll back.
          </p>
        </div>
      ) : tab === "knowledge" ? (
        <div className="paper admin-form">
          <h2>Add a knowledge source</h2>
          <p>Drafts are not used in parent conversations.</p>
          {(["title", "publisher", "url", "licence"] as const).map((k) => (
            <label key={k}>
              {k === "url"
                ? "Source URL"
                : k === "licence"
                  ? "Reuse permission / licence"
                  : k[0].toUpperCase() + k.slice(1)}
              <Input
                value={source[k]}
                onChange={(e) => setSource({ ...source, [k]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Source text
            <Textarea
              rows={8}
              value={source.text}
              onChange={(e) => setSource({ ...source, text: e.target.value })}
              maxLength={100000}
            />
          </label>
          <Button
            disabled={busy || !source.text || !source.title}
            onClick={() => action({ action: "save-source", source })}
          >
            Save draft
          </Button>
          <label>
            Reviewer name
            <span>Record the real reviewer, not the coding assistant.</span>
            <Input
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
            />
          </label>
          {state.sources.map((s: any) => (
            <div className="model-row" key={s.id}>
              <span>
                {s.title}
                <small>{s.state}</small>
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={s.state !== "published" && !reviewer.trim()}
                onClick={() =>
                  action({
                    action: s.state === "published" ? "unpublish" : "publish",
                    id: s.id,
                    reviewer,
                  })
                }
              >
                {s.state === "published" ? "Unpublish" : "Review & publish"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="paper admin-form">
            <h2>Availability & spending</h2>
            <label>
              Maximum monthly AI spend (USD)
              <Input
                type="number"
                min="0"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <Button
              disabled={busy}
              onClick={() =>
                action({
                  action: "settings",
                  monthly_budget: Number(budget),
                  paused: state.settings.paused,
                })
              }
            >
              Save spending limit
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                action({
                  action: "settings",
                  monthly_budget: Number(budget),
                  paused: !state.settings.paused,
                })
              }
            >
              {state.settings.paused
                ? "Enable AI requests"
                : "Pause AI requests"}
            </Button>
            <p className="small-print">
              The real-family launch gate and model approval still apply.
              Pausing AI keeps saved information accessible.
            </p>
          </div>
          <div className="paper" style={{ marginTop: 20 }}>
            <h2>Background work</h2>
            {state.jobs.length ? (
              state.jobs.map((j: any) => (
                <div className="model-row" key={j.id}>
                  <span>
                    {j.kind}
                    <small>
                      {j.state} · attempt {j.attempts}
                    </small>
                  </span>
                  {j.state === "failed" && (
                    <Button
                      variant="outline"
                      onClick={() => action({ action: "retry-job", id: j.id })}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p>No background work to show.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
