"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import type { ReactNode } from "react";

/* ── Scroll progress bar ───────────────────────────────────────────── */

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX: width, transformOrigin: "0%" }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500"
    />
  );
}

/* ── Count-up statistic ────────────────────────────────────────────── */

export function CountUp({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.6,
  className = "",
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!inView) return;

    // A number is content, not decoration — it must never be left reading 0
    // because an animation could not run. Background tabs pause rAF, so snap
    // straight to the value there rather than starting a frame loop.
    if (reduced || document.hidden) {
      setDisplay(to);
      return;
    }

    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
      // Land exactly on the target rather than a float a hair short of it.
      onComplete: () => setDisplay(to),
    });

    // If the tab is hidden mid-count, finish immediately.
    const onHide = () => {
      if (document.hidden) {
        controls.stop();
        setDisplay(to);
      }
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      controls.stop();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [inView, to, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ── Parallax wrapper ──────────────────────────────────────────────── */

export function Parallax({
  children,
  distance = 60,
  className = "",
}: {
  children: ReactNode;
  /** Pixels of travel across the full scroll of the element. */
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/* ── Word-by-word headline reveal ──────────────────────────────────── */

export function WordsReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.9,
              delay: delay + i * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/* ── Spotlight card (pointer-tracked warm glow) ────────────────────── */

export function SpotlightCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(-9999);
  const my = useMotionValue(-9999);
  const reduced = useReducedMotion();

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const background = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(340px circle at ${x}px ${y}px, rgba(245,158,11,0.10), transparent 68%)`
  );

  return (
    <div
      ref={ref}
      onMouseMove={reduced ? undefined : onMove}
      onMouseLeave={() => {
        mx.set(-9999);
        my.set(-9999);
      }}
      className={`group relative overflow-hidden ${className}`}
    >
      {!reduced && (
        <motion.div
          aria-hidden
          style={{ background }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

/* ── Marquee-free logo row that eases in on view ───────────────────── */

export function FadeUp({
  children,
  delay = 0,
  y = 20,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
