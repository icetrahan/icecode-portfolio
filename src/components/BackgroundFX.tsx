// Subtle site-wide ambient background: slow-drifting ice-blue glow blobs over a
// faint grid. Purely decorative, fixed behind all content, and motion is
// disabled under prefers-reduced-motion (see globals.css).
export default function BackgroundFX() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="bg-grid" />
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />
    </div>
  );
}
