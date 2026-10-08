import { NextResponse } from "next/server";

// Contact form → email to Ice via Resend. The key lives only on the host
// (site.env next to the launcher, see deploy/README.md), never in this repo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TO = process.env.CONTACT_TO || "trahantech@gmail.com";
const FROM = process.env.CONTACT_FROM || "icecode.dev <contact@mail.primalhosted.com>";
const LIMIT = 5; // messages per IP per hour
const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function fail(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail(400, "That didn't look like a form submission.");
  }
  const name = String(body.name ?? "").trim().slice(0, 120);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const subject = String(body.subject ?? "").trim().slice(0, 160);
  const message = String(body.message ?? "").trim().slice(0, 5000);

  // Honeypot: real people never see or fill this field. Pretend it worked so bots move on.
  if (String(body.website ?? "").trim()) {
    console.warn(`[contact] honeypot tripped — dropped, NOT sent (claimed ${email || "no email"})`);
    return NextResponse.json({ ok: true });
  }

  if (!name || !message) return fail(400, "Please add your name and a message.");
  if (!EMAIL_RE.test(email)) return fail(400, "That email address doesn't look right.");
  if (message.length < 10) return fail(400, "Tell me a little more — at least a sentence.");

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return fail(429, `Too many messages from here — email me directly at ${TO}.`);

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[contact] RESEND_API_KEY is not set — message NOT sent");
    return fail(503, `The form isn't connected right now — email me directly at ${TO}.`);
  }

  const title = subject || message.split("\n")[0].slice(0, 60);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `icecode.dev — ${name}: ${title}`,
      text: `${message}\n\n— ${name} <${email}>\nSent from the contact form on icecode.dev`,
      html:
        `<p style="white-space:pre-wrap;font:15px/1.5 system-ui,sans-serif">${escape(message)}</p>` +
        `<p style="font:14px system-ui,sans-serif;color:#555">— ${escape(name)} &lt;${escape(email)}&gt;<br>` +
        `Sent from the contact form on icecode.dev. Reply to this email to answer them.</p>`,
    }),
  }).catch((e: unknown) => {
    console.error("[contact] Resend unreachable:", e);
    return null;
  });

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => "") : "network error";
    console.error(`[contact] Resend refused (${res?.status ?? "-"}): ${detail.slice(0, 300)}`);
    return fail(502, `Couldn't send that one — email me directly at ${TO}.`);
  }

  hits.set(ip, [...recent, now]);
  const { id } = (await res.json().catch(() => ({}))) as { id?: string };
  console.log(`[contact] sent ${id ?? "(no id)"} from ${email}`);
  return NextResponse.json({ ok: true });
}
