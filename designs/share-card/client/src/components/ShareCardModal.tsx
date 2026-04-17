/**
 * ShareCardModal.tsx — PointCast Share-Card Modal Component
 *
 * Drop-in React component that:
 *  1. Accepts a ShareCardEvent as prop
 *  2. Renders a "Share" trigger button
 *  3. Opens a modal with the generated 1024×1024 PNG preview
 *  4. Provides Save / Copy / Share actions
 *
 * Design: paper/cream bg, ink text, warm accent — matches share-card tokens.
 */

import { useState, useCallback, useRef } from "react";
import { generateShareCard, type ShareCardEvent } from "@/lib/share-card";

// ─── Icons (inline SVG, no external dep) ─────────────────────────────────────

const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const IconDownload = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const IconCopy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconDrum = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="6" rx="10" ry="4"/>
    <path d="M2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6"/>
    <path d="M2 12c0 2.21 4.48 4 10 4s10-1.79 10-4"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareCardButtonProps {
  event: ShareCardEvent;
  /** Custom label for the trigger button */
  label?: string;
  /** Additional CSS classes for the trigger button */
  className?: string;
}

type ActionState = "idle" | "loading" | "ready" | "copying" | "sharing" | "saved";

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareCardButton({
  event,
  label = "Share",
  className = "",
}: ShareCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>("idle");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback(async () => {
    setOpen(true);
    setState("loading");
    setError(null);
    try {
      const b = await generateShareCard(event);
      const url = URL.createObjectURL(b);
      setBlob(b);
      setBlobUrl(url);
      setState("ready");
    } catch (e) {
      setError(String(e));
      setState("idle");
    }
  }, [event]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setState("idle");
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setBlob(null);
    }
  }, [blobUrl]);

  const handleSave = useCallback(() => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `pointcast-${event.type}-${Date.now()}.png`;
    a.click();
    setState("saved");
    setTimeout(() => setState("ready"), 2000);
  }, [blobUrl, event.type]);

  const handleCopy = useCallback(async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      // Fallback: open image in new tab for manual copy
      if (blobUrl) window.open(blobUrl, "_blank");
    }
  }, [blob, blobUrl]);

  const handleShare = useCallback(async () => {
    if (!blob) return;
    const file = new File([blob], `pointcast-${event.type}.png`, {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: event.title,
          text: `${event.title} — pointcast.xyz`,
        });
      } catch {
        // User cancelled or share failed — silently ignore
      }
    } else {
      // Fallback: download
      handleSave();
    }
  }, [blob, event.title, event.type, handleSave]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) closeModal();
    },
    [closeModal]
  );

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        onClick={openModal}
        className={`pc-share-btn ${className}`}
        aria-label="Open share card"
      >
        <IconDrum />
        <span>{label}</span>
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          ref={overlayRef}
          className="pc-modal-overlay"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="Share card"
        >
          <div className="pc-modal">
            {/* Header */}
            <div className="pc-modal-header">
              <span className="pc-modal-title">Share Card</span>
              <button
                className="pc-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <IconX />
              </button>
            </div>

            {/* Card Preview */}
            <div className="pc-modal-preview">
              {state === "loading" && (
                <div className="pc-loading">
                  <div className="pc-spinner" />
                  <span>Generating card…</span>
                </div>
              )}
              {state !== "loading" && blobUrl && (
                <img
                  src={blobUrl}
                  alt="Generated share card"
                  className="pc-card-img"
                />
              )}
              {error && (
                <div className="pc-error">
                  <span>Failed to generate card.</span>
                  <code>{error}</code>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {state !== "loading" && blobUrl && (
              <div className="pc-action-bar">
                <button
                  className="pc-action-btn pc-action-save"
                  onClick={handleSave}
                  title="Save as PNG"
                >
                  <IconDownload />
                  <span>{state === "saved" ? "Saved!" : "Save"}</span>
                </button>
                <button
                  className="pc-action-btn pc-action-copy"
                  onClick={handleCopy}
                  title="Copy image to clipboard"
                >
                  <IconCopy />
                  <span>{copyDone ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  className="pc-action-btn pc-action-share"
                  onClick={handleShare}
                  title="Share via Web Share API"
                >
                  <IconShare />
                  <span>Share</span>
                </button>
              </div>
            )}

            {/* Footer hint */}
            <p className="pc-modal-hint">
              1024 × 1024 PNG · optimised for iMessage, Warpcast, Twitter &amp; Instagram
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default ShareCardButton;
