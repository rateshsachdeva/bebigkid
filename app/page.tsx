import Link from "next/link";
import {
  ArrowUpRight,
  HeartHandshake,
  LockKeyhole,
  MessageCircle,
  NotebookPen,
} from "lucide-react";
export default function Page() {
  return (
    <main className="landing">
      <header>
        <Link className="brand" href="/">
          <HeartHandshake />
          alongside<span className="brand-dot">.</span>
        </Link>
        <Link className="quiet-link" href="/sign-in">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="landing-main">
        <div className="eyebrow">FOR PARENTS OF AUTISTIC CHILDREN</div>
        <h1>
          You don’t have to
          <br />
          figure it all out
          <br />
          <em>on your own.</em>
        </h1>
        <p>
          A space to talk through the difficult moments, find a next step, and
          remember what helps your family.
        </p>
        <Link className="primary-button" href="/sign-in">
          Start a conversation <ArrowUpRight size={18} />
        </Link>
        <Link className="text-link" href="/preview">
          Explore a sample experience
        </Link>
        <div className="landing-benefits">
          <span>
            <MessageCircle />
            Practical support
          </span>
          <span>
            <NotebookPen />
            Context you control
          </span>
          <span>
            <LockKeyhole />
            Private from other users
          </span>
        </div>
      </section>
      <footer>
        <p>
          AI support, with room for your judgement. Not a diagnosis or emergency
          service.
        </p>
        <nav>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
        </nav>
      </footer>
    </main>
  );
}
