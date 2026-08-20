"use client";

import { useState } from "react";

// Product/review media URLs are free-text (admin-entered or hotlinked from wherever
// the admin copied them from) — nothing guarantees the URL is still reachable (dead
// link, CORS block, hotlink protection on someone else's CDN, etc). A raw <img>/
// <video> with a broken src renders the browser's ugly broken-image glyph and can
// hang retrying. These wrappers catch that with onError and swap to a plain "Sem
// imagem" placeholder instead — never a fix for *why* a URL is unreachable, just a
// graceful degradation so a bad URL doesn't wreck the layout.

export function FallbackImg({
  src,
  alt,
  className,
  placeholderClassName,
  placeholderText = "Sem imagem",
  placeholder,
  loading,
  fetchPriority,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  placeholderText?: string;
  /** Custom fallback content (e.g. initials) instead of the default "Sem imagem" text. */
  placeholder?: React.ReactNode;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    // `placeholder={null}` explicitly means "render nothing" (e.g. a small thumbnail
    // button that just stays empty); omitting the prop uses the default text block.
    if (placeholder !== undefined) return <>{placeholder}</>;
    return (
      <div
        className={
          placeholderClassName ??
          `flex h-full w-full items-center justify-center bg-neutral-100 text-[10px] text-foreground/40 ${className ?? ""}`
        }
      >
        {placeholderText}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      onError={() => setFailed(true)}
    />
  );
}

export function FallbackVideo({
  src,
  className,
  placeholderClassName,
  placeholderText = "Vídeo indisponível",
  autoPlay,
  muted,
  loop,
  controls,
  poster,
  playsInline,
  preload,
}: {
  src: string | null | undefined;
  className?: string;
  placeholderClassName?: string;
  placeholderText?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  playsInline?: boolean;
  preload?: "auto" | "metadata" | "none";
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={
          placeholderClassName ??
          `flex h-full w-full items-center justify-center bg-neutral-100 text-[10px] text-foreground/40 ${className ?? ""}`
        }
      >
        {placeholderText}
      </div>
    );
  }

  return (
    <video
      src={src}
      className={className}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={controls}
      poster={poster}
      playsInline={playsInline}
      preload={preload}
      onError={() => setFailed(true)}
    />
  );
}
