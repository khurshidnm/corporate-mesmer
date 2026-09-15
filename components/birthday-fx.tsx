"use client";

import { useEffect, useState, type ReactNode } from "react";
import Confetti from "react-confetti";
import { cn } from "@/lib/utils";

// Blue-led palette so the confetti still feels like this app
const CONFETTI_COLORS = [
  "#2563eb",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#34d399",
  "#fb7185",
];

const FESTIVE_GRADIENT =
  "bg-[conic-gradient(from_0deg,#2563eb,#a78bfa,#f472b6,#fbbf24,#34d399,#2563eb)]";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return size;
}

interface BirthdayConfettiProps {
  /** Starts a shower whenever this becomes true */
  active: boolean;
  /** Bump to fire another shower while `active` is unchanged */
  burst?: number;
  durationMs?: number;
}

/**
 * Full-screen confetti shower. Emits for `durationMs`, lets the last pieces
 * fall, then unmounts the canvas entirely so nothing keeps animating (and
 * burning CPU) in the background. Skipped for users who prefer reduced motion.
 */
export function BirthdayConfetti({
  active,
  burst = 0,
  durationMs = 6000,
}: BirthdayConfettiProps) {
  const { width, height } = useWindowSize();
  const [mounted, setMounted] = useState(false);
  const [emitting, setEmitting] = useState(false);
  // Every shower gets its own tick so the stop-timer is only ever reset by a
  // new shower, never by `active` flipping off while one is still running.
  const [shower, setShower] = useState(0);

  useEffect(() => {
    if (active) setShower((n) => n + 1);
  }, [active]);

  useEffect(() => {
    if (burst > 0) setShower((n) => n + 1);
  }, [burst]);

  useEffect(() => {
    if (shower === 0 || prefersReducedMotion()) return;
    setMounted(true);
    setEmitting(true);
    const timer = setTimeout(() => setEmitting(false), durationMs);
    return () => clearTimeout(timer);
  }, [shower, durationMs]);

  if (!mounted || !width) return null;

  return (
    <Confetti
      width={width}
      height={height}
      numberOfPieces={emitting ? 280 : 0}
      recycle={emitting}
      gravity={0.16}
      wind={0.005}
      colors={CONFETTI_COLORS}
      onConfettiComplete={(confetti) => {
        setMounted(false);
        confetti?.reset();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
      }}
    />
  );
}

interface FestiveRingProps {
  children: ReactNode;
  className?: string;
}

/** Slowly spinning rainbow ring with a soft glow, wrapped around an avatar. */
export function FestiveRing({ children, className }: FestiveRingProps) {
  return (
    <div className={cn("relative inline-flex rounded-full", className)}>
      <div
        aria-hidden
        className={cn(
          "absolute -inset-1.5 rounded-full opacity-60 blur-md animate-spin-slow motion-reduce:animate-none",
          FESTIVE_GRADIENT
        )}
      />
      <div
        aria-hidden
        className={cn(
          "absolute -inset-1 rounded-full animate-spin-slow motion-reduce:animate-none",
          FESTIVE_GRADIENT
        )}
      />
      <div className="relative rounded-full bg-white p-1">{children}</div>
    </div>
  );
}

const DECORATIONS = [
  { emoji: "🎈", left: "5%", top: "16%", delay: "0s", size: "text-2xl" },
  { emoji: "✨", left: "17%", top: "64%", delay: "0.9s", size: "text-lg" },
  { emoji: "🎉", left: "81%", top: "18%", delay: "0.4s", size: "text-2xl" },
  { emoji: "🎁", left: "89%", top: "64%", delay: "1.3s", size: "text-xl" },
  { emoji: "⭐", left: "29%", top: "10%", delay: "1.7s", size: "text-base" },
  { emoji: "🎈", left: "69%", top: "70%", delay: "2.2s", size: "text-lg" },
];

/** Floating emoji scattered over a header; parent must be `relative`. */
export function FloatingDecorations() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {DECORATIONS.map((item, i) => (
        <span
          key={i}
          className={cn(
            "absolute select-none opacity-90 drop-shadow animate-float motion-reduce:animate-none",
            item.size
          )}
          style={{ left: item.left, top: item.top, animationDelay: item.delay }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}
