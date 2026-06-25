"use client";
import Image from "next/image";
import { useState } from "react";

export const DISCORD_HANDLE = "Ice.code";

/**
 * Discord doesn't expose a reliable "add friend" deep link, so instead of a
 * dead invite we let visitors copy the handle and add Ice as a friend.
 * - variant "icon": round social button (hero) with a hover/after-click tooltip
 * - variant "link": text button (footer)
 * - variant "inline": plain handle + copy affordance (contact page)
 */
export default function DiscordCopy({
  variant = "icon",
}: {
  variant?: "icon" | "link" | "inline";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_HANDLE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — the handle is still shown via title/text
    }
  };

  const title = `Add me on Discord: ${DISCORD_HANDLE} (click to copy)`;

  if (variant === "link") {
    return (
      <button
        onClick={copy}
        title={title}
        className="text-gray-400 hover:text-ice-blue transition-colors text-left"
      >
        {copied ? "Copied Ice.code!" : "Discord"}
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={copy}
        title={title}
        className="inline-flex items-center gap-2 hover:text-ice-blue transition-colors"
      >
        <span className="text-ice-blue">@</span>
        <span>{DISCORD_HANDLE}</span>
        <span className="text-xs text-gray-500">{copied ? "copied!" : "(copy)"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      title={title}
      className="group relative w-12 h-12 rounded-full bg-black/50 dark:bg-gray-800/70 flex items-center justify-center border border-gray-700 hover:border-ice-blue hover:bg-gray-700/50 transition-all duration-300 shadow-md"
    >
      <span className="sr-only">Add me on Discord: {DISCORD_HANDLE}</span>
      <Image src="/icons/DiscordLogo.png" alt="Discord" width={24} height={24} />
      <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-200 opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? "Copied!" : DISCORD_HANDLE}
      </span>
    </button>
  );
}
