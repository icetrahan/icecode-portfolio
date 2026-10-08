"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ContactForm from "@/components/ContactForm";
import { CONTACT_EMAIL, socials } from "@/data/socials";

const OPEN_EVENT = "icecode:open-contact";

/** Any "Let's build something" button: opens the contact form wherever you are. */
export function ContactButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      {children}
    </button>
  );
}

/** Mounted once in the layout; listens for ContactButton clicks. */
export default function ContactModal() {
  const ref = useRef<HTMLDialogElement>(null);
  const [key, setKey] = useState(0); // fresh form each time it opens

  useEffect(() => {
    const open = () => {
      setKey((k) => k + 1);
      ref.current?.showModal();
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  return (
    <dialog
      ref={ref}
      className="contact-dialog"
      aria-labelledby="contact-dialog-title"
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
    >
      <div className="contact-dialog-inner">
        <button type="button" className="contact-close" aria-label="Close" onClick={() => ref.current?.close()}>×</button>
        <p className="eyebrow">Let&apos;s build something</p>
        <h2 id="contact-dialog-title">Tell me what you&apos;re working on.</h2>
        <p className="contact-lede">
          It lands straight in my inbox. Prefer something else? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          {" · "}<a href={socials.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </p>
        <ContactForm key={key} />
      </div>
    </dialog>
  );
}
