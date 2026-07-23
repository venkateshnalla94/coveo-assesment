"use client";

import { X } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { GenerativeCitations } from "@/components/generative/GenerativeCitations";
import type { GenerativeCitation } from "@/features/generative/models/generative-models";

type GenerativeModalTab = "answer" | "citations";

const PREVIEW_REVEAL_CHARS_PER_TICK = 3;
const PREVIEW_REVEAL_INTERVAL_MS = 20;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function GenerativeAnswerContent({
  answer,
  animatePreview = false,
  citations,
  compact = true,
  query,
}: {
  answer: string;
  animatePreview?: boolean;
  citations: GenerativeCitation[];
  compact?: boolean;
  query: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<GenerativeModalTab>("answer");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasOpenedRef = useRef(false);
  const titleId = useId();
  const answerTabId = useId();
  const answerPanelId = useId();
  const citationsTabId = useId();
  const citationsPanelId = useId();
  const previewText = useMemo(() => getCompactAnswer(answer), [answer]);
  const shouldAnimate = animatePreview && !prefersReducedMotion();
  const [revealedLength, setRevealedLength] = useState(0);

  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      closeButtonRef.current?.focus();
      return;
    }

    if (hasOpenedRef.current) {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!shouldAnimate) {
      return;
    }

    let current = 0;

    const timer = window.setInterval(() => {
      current = Math.min(current + PREVIEW_REVEAL_CHARS_PER_TICK, previewText.length);
      setRevealedLength(current);

      if (current >= previewText.length) {
        window.clearInterval(timer);
      }
    }, PREVIEW_REVEAL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [shouldAnimate, previewText]);

  if (!compact) {
    return (
      <div className="generative-content">
        <p>{answer}</p>
        <GenerativeCitations citations={citations} query={query} />
      </div>
    );
  }

  function closeModal() {
    setIsOpen(false);
    setActiveTab("answer");
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      closeModal();
    }
  }

  const isRevealing = shouldAnimate && revealedLength < previewText.length;
  const displayedText = shouldAnimate ? previewText.slice(0, revealedLength) : previewText;

  return (
    <div aria-busy={isRevealing} aria-live="polite" className="generative-content">
      <p className={isRevealing ? "generative-streaming-text" : undefined}>
        {displayedText}
        {isRevealing ? null : (
          <>
            {" "}
            <button
              aria-label="Read full guidance and citations"
              className="generative-more-link"
              onClick={() => setIsOpen(true)}
              ref={triggerRef}
              title="Read full guidance and citations"
              type="button"
            >
              more
            </button>
          </>
        )}
      </p>

      {isOpen && !isRevealing ? (
        <div className="drawer-backdrop generative-modal-backdrop" role="presentation">
          <section
            aria-labelledby={titleId}
            aria-modal="true"
            className="generative-modal"
            onKeyDown={handleDialogKeyDown}
            role="dialog"
          >
            <div className="drawer-header">
              <h2 id={titleId}>AI Product Guidance</h2>
              <button
                aria-label="Close AI product guidance"
                className="icon-button"
                onClick={closeModal}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <div aria-label="AI product guidance sections" className="generative-tabs" role="tablist">
              <button
                aria-controls={answerPanelId}
                aria-selected={activeTab === "answer"}
                id={answerTabId}
                onClick={() => setActiveTab("answer")}
                role="tab"
                type="button"
              >
                Extended response
              </button>
              <button
                aria-controls={citationsPanelId}
                aria-selected={activeTab === "citations"}
                id={citationsTabId}
                onClick={() => setActiveTab("citations")}
                role="tab"
                type="button"
              >
                Citations ({citations.length})
              </button>
            </div>

            <div className="generative-modal-body">
              {activeTab === "answer" ? (
                <div aria-labelledby={answerTabId} id={answerPanelId} role="tabpanel" tabIndex={0}>
                  <p>{answer}</p>
                </div>
              ) : null}

              {activeTab === "citations" ? (
                <div aria-labelledby={citationsTabId} id={citationsPanelId} role="tabpanel" tabIndex={0}>
                  <GenerativeCitations citations={citations} query={query} />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

const SENTENCE_PREVIEW_COUNT = 2;
const SENTENCE_PREVIEW_MAX_LENGTH = 280;

function getCompactAnswer(answer: string) {
  const normalized = answer.trim();
  const sentences = normalized.match(/[^.!?]+[.!?]+(\s+|$)/g);
  const preview = sentences?.slice(0, SENTENCE_PREVIEW_COUNT).join("").trim();

  if (preview && preview.length < normalized.length) {
    return `${preview}...`;
  }

  if (preview) {
    return preview;
  }

  if (normalized.length <= SENTENCE_PREVIEW_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, SENTENCE_PREVIEW_MAX_LENGTH).trimEnd()}...`;
}
