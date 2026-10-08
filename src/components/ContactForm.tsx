"use client";
import { useState } from "react";
import { CONTACT_EMAIL } from "@/data/socials";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export default function ContactForm({ onSent }: { onSent?: () => void }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && json.ok) {
        setState({ kind: "sent" });
        onSent?.();
      } else {
        setState({ kind: "error", message: json.error || `Something went wrong — email me at ${CONTACT_EMAIL}.` });
      }
    } catch {
      setState({ kind: "error", message: `Couldn't reach the server — email me at ${CONTACT_EMAIL}.` });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="contact-sent" role="status">
        <b>Message sent.</b>
        <p>Thanks — it&apos;s in my inbox. I usually answer within a day or two.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-row">
        <label>
          <span>Name</span>
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" />
        </label>
      </div>
      <label>
        <span>What are we building? <em>(optional)</em></span>
        <input name="subject" maxLength={160} placeholder="A platform, a game system, a bot, a fix…" />
      </label>
      <label>
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} />
      </label>
      {/* Honeypot: hidden from people, irresistible to bots. */}
      <label className="contact-hp" aria-hidden="true">
        Website <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state.kind === "error" && <p className="contact-error" role="alert">{state.message}</p>}
      <button className="button button-primary" type="submit" disabled={state.kind === "sending"}>
        {state.kind === "sending" ? "Sending…" : "Send message"} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
