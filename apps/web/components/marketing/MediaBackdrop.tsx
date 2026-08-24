"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed media layer for the marketing sections.
 *
 * The poster image is the LCP element and always paints first. Video is
 * attached only after mount, only on wide viewports, and only when the visitor
 * hasn't asked for reduced motion — so mobile data plans and motion-sensitive
 * visitors never download it. If the video file is missing or fails, the poster
 * stays and slowly drifts, so a still frame still feels alive.
 */
export default function MediaBackdrop({
  poster,
  videoSrc,
  scrim = "hero",
  className = "",
  objectPosition = "center",
  zoom,
  shiftY,
}: {
  poster: string;
  /** Optional. Omit (or leave the file absent) and the poster carries it. */
  videoSrc?: string;
  scrim?: "hero" | "soft" | "deep" | "dawn" | "none";
  className?: string;
  /**
   * Which part of the image survives the `object-fit: cover` crop. A value
   * past 50% pulls the framing further down the source, which raises the
   * subject within the visible area.
   */
  objectPosition?: string;
  /** Base scale for the drift. Higher values create more crop room. */
  zoom?: number;
  /** Percentage shift, e.g. -6 lifts the subject up out of the bottom edge. */
  shiftY?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(false);

  useEffect(() => {
    if (!videoSrc) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    // Respect data-saver / slow connections where the browser reports them.
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData) return;
    if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return;

    const el = videoRef.current;
    if (!el) return;

    const onReady = () => setVideoOk(true);
    el.addEventListener("loadeddata", onReady, { once: true });
    el.src = videoSrc;
    el.load();
    const play = el.play();
    if (play && typeof play.catch === "function") play.catch(() => undefined);

    return () => el.removeEventListener("loadeddata", onReady);
  }, [videoSrc]);

  const scrims: Record<string, string> = {
    hero: "linear-gradient(180deg, rgba(24,12,2,0.72) 0%, rgba(24,12,2,0.52) 42%, rgba(24,12,2,0.78) 100%)",
    soft: "linear-gradient(180deg, rgba(24,12,2,0.45) 0%, rgba(24,12,2,0.6) 100%)",
    deep: "linear-gradient(180deg, rgba(20,10,2,0.84) 0%, rgba(20,10,2,0.9) 100%)",
    none: "none",
  };

  // The dawn wash is a class rather than a gradient string: it layers two
  // gradients so dark text stays readable over a bright sky photo.
  const isDawn = scrim === "dawn";

  return (
    <div className={`mk-media__wrap ${className}`} aria-hidden>
      {/* Poster — always present, always the paint target */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        style={
          {
            objectPosition,
            ...(zoom !== undefined ? { "--mk-zoom": zoom } : {}),
            ...(shiftY !== undefined ? { "--mk-shift-y": `${shiftY}%` } : {}),
          } as React.CSSProperties
        }
        className={`mk-media__layer ${videoOk ? "opacity-0" : "mk-kenburns opacity-100"} transition-opacity duration-700`}
      />
      {videoSrc && (
        <video
          ref={videoRef}
          style={{ objectPosition, transform: zoom ? `scale(${zoom})` : undefined }}
          className={`mk-media__layer transition-opacity duration-700 ${videoOk ? "opacity-100" : "opacity-0"}`}
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
        />
      )}
      {scrim !== "none" &&
        (isDawn ? (
          <div className="mk-media__scrim mk-scrim-dawn" />
        ) : (
          <div className="mk-media__scrim" style={{ background: scrims[scrim] }} />
        ))}
    </div>
  );
}
