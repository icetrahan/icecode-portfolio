"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * The ice.code mascot. Eyes follow the cursor with eased rAF motion and the
 * face subtly turns toward it. Plus a couple of easter eggs, all driven from a
 * single rAF loop writing transforms straight to the DOM (no React re-renders
 * on mouse move):
 *   • hover the nose  → pupils slowly cross
 *   • circle him fast → eyes spin independently like he's dizzy (+ head wobble)
 *   • idle            → he gently looks around
 *   • click / timer   → blinks
 */
export default function HeroCharacter() {
  const boxRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const [blinking, setBlinking] = useState(false);

  const target = useRef({ x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0 });
  const lastMove = useRef(0);

  const crossTarget = useRef(0); // desired cross-eyed amount (0 or 1)
  const cross = useRef(0); // eased cross-eyed amount
  const dizzyUntil = useRef(0); // timestamp the dizzy spin ends
  const lastTime = useRef(0);
  const lastAngle = useRef<number | null>(null);
  const spin = useRef(0); // signed accumulated rotation around him
  const spinDir = useRef(0); // direction of the current sweep (+1 / -1)
  const spinStart = useRef(0); // when the current sweep began

  // Cursor tracking + gesture detection.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = boxRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // unclamped → real proximity; clamped → eye tracking
      const rawX = (e.clientX - cx) / (r.width / 2);
      const rawY = (e.clientY - cy) / (r.height / 2);
      const nx = Math.max(-1, Math.min(1, rawX));
      const ny = Math.max(-1, Math.min(1, rawY));
      target.current = { x: nx, y: ny };

      const now = performance.now();
      const near = Math.hypot(rawX, rawY) < 1.7; // genuinely close to him

      // Hovering the nose (just below centre) → cross his eyes.
      crossTarget.current = near && Math.hypot(nx, ny - 0.12) < 0.24 ? 1 : 0;

      // Dizzy: a deliberate spin *around* him. We accumulate signed rotation
      // about his centre while the cursor keeps going one direction, and trip
      // at ~1 full loop within ~1.4s. Because the angle only completes a turn
      // when he's actually inside your loop, a straight pass (≤ half turn) or a
      // wiggle (reverses → resets) can never reach it — but circling the page
      // around him does.
      const rawDist = Math.hypot(rawX, rawY);
      const ang = Math.atan2(rawY, rawX);
      const dt = now - lastTime.current;
      const inRing = rawDist > 0.4 && rawDist < 9;
      if (lastAngle.current !== null && inRing && dt > 0 && dt < 160) {
        const d =
          ((ang - lastAngle.current + Math.PI) % (2 * Math.PI)) - Math.PI;
        const dir = d >= 0 ? 1 : -1;
        if (spin.current !== 0 && dir === spinDir.current) {
          spin.current += d; // continue the sweep
        } else {
          spin.current = d; // first sample or reversal → fresh sweep
          spinDir.current = dir;
          spinStart.current = now;
        }
        if (now - spinStart.current > 1400) {
          spin.current = 0; // too slow to be a "spin"
        } else if (Math.abs(spin.current) > 5.6 && now > dizzyUntil.current) {
          dizzyUntil.current = now + 2600; // ~1 loop around him → spin ~2.6s
          spin.current = 0;
        }
      } else {
        spin.current = 0; // off his centre / paused → reset the sweep
      }
      lastAngle.current = ang;
      lastTime.current = now;
      lastMove.current = now;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Single eased animation loop.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const EYE = 10;
    let raf = 0;
    const loop = (t: number) => {
      // base tracking target (+ idle look-around)
      let tx = target.current.x;
      let ty = target.current.y;
      if (!reduce && t - lastMove.current > 2500) {
        tx = Math.sin(t / 1600) * 0.55;
        ty = Math.cos(t / 2100) * 0.4;
      }
      cur.current.x += (tx - cur.current.x) * 0.09;
      cur.current.y += (ty - cur.current.y) * 0.09;

      // slowly ease the cross-eyed amount toward its target
      cross.current += ((reduce ? 0 : crossTarget.current) - cross.current) * 0.045;

      // dizzy fades out across its window
      const dz = reduce
        ? 0
        : Math.max(0, Math.min(1, (dizzyUntil.current - t) / 2600));

      // start from plain cursor-tracking (both eyes together)
      let lx = cur.current.x * EYE;
      let ly = cur.current.y * EYE;
      let rx = lx;
      let ry = ly;

      // cross-eyed: pupils converge toward the nose (independent L/R)
      const cw = cross.current;
      if (cw > 0.001) {
        const conv = 7;
        lx = lx * (1 - cw) + conv * cw; // left pupil → inward (right)
        rx = rx * (1 - cw) - conv * cw; // right pupil → inward (left)
        ly = ly * (1 - cw) + 3 * cw;
        ry = ry * (1 - cw) + 3 * cw;
      }

      // dizzy: each eye spins on its own little orbit, opposite directions
      if (dz > 0.001) {
        const radius = 6 * dz;
        const aL = t / 110;
        const aR = -t / 95;
        lx = lx * (1 - dz) + Math.cos(aL) * radius;
        ly = ly * (1 - dz) + Math.sin(aL) * radius;
        rx = rx * (1 - dz) + Math.cos(aR) * radius;
        ry = ry * (1 - dz) + Math.sin(aR) * radius;
      }

      if (leftEyeRef.current)
        leftEyeRef.current.style.transform = `translate(${lx}px, ${ly}px)`;
      if (rightEyeRef.current)
        rightEyeRef.current.style.transform = `translate(${rx}px, ${ry}px)`;

      // face parallax/tilt, with a small wobble while dizzy
      const wobble = dz > 0.001 ? Math.sin(t / 90) * 2.5 * dz : 0;
      if (faceRef.current)
        faceRef.current.style.transform = `translate(${cur.current.x * 4}px, ${
          cur.current.y * 3
        }px) rotate(${cur.current.x * 2 + wobble}deg)`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Natural, randomised blinking (plus the occasional double-blink).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const blink = () => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 130);
    };
    const schedule = () => {
      timer = setTimeout(() => {
        blink();
        if (Math.random() < 0.25) setTimeout(blink, 280);
        schedule();
      }, 2600 + Math.random() * 3600);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    setBlinking(true);
    setTimeout(() => setBlinking(false), 130);
  };

  return (
    <div className="w-full md:w-1/3 flex justify-center pt-20 select-none">
      <div
        ref={boxRef}
        onClick={handleClick}
        className="relative w-96 h-96 flex items-center justify-center cursor-pointer"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-ice-blue/20 rounded-full blur-3xl animate-pulse-slow" />

        <div className="relative w-80 h-80">
          {/* Face stack — gets the subtle parallax/tilt */}
          <div ref={faceRef} className="relative w-full h-full will-change-transform">
            <Image
              src="/logo/SelfCartoonLower.png"
              alt="ice.code mascot"
              width={400}
              height={400}
              className="absolute inset-0 w-full h-full object-contain"
              priority
            />
            <div className="absolute bottom-8 left-1 w-full h-full pointer-events-none">
              <div ref={leftEyeRef} className="will-change-transform">
                <Image
                  src="/logo/SelfCartoonEyesLeft.png"
                  alt=""
                  width={400}
                  height={400}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="absolute bottom-8 right-[2%] w-full h-full pointer-events-none">
              <div ref={rightEyeRef} className="will-change-transform">
                <Image
                  src="/logo/SelfCartoonEyesRight.png"
                  alt=""
                  width={400}
                  height={400}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <Image
              src="/logo/SelfCartoonLids.png"
              alt=""
              width={400}
              height={400}
              className={`absolute bottom-3 left-0 w-full h-full object-contain transition-transform duration-150 ${
                blinking ? "translate-y-[18px]" : "translate-y-0"
              }`}
            />
            <Image
              src="/logo/SelfCartoonUpper.png"
              alt=""
              width={400}
              height={400}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* Name */}
          <div className="absolute -bottom-12 left-0 right-0 text-center">
            <h1 className="text-4xl font-bold text-ice-blue">ice.code</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
