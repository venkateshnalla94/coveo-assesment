"use client";

import { X } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { GenerativeCitations } from "@/components/generative/GenerativeCitations";
import type { GenerativeCitation } from "@/features/generative/models/generative-models";

type GenerativeModalTab = "answer" | "citations";

export function GenerativeAnswerContent({
  answer,
  citations,
  compact = true,
  query,
}: {
  answer: string;
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

  return (
    <div className="generative-content">
      <p>{getCompactAnswer(answer)}</p>
      <button
        className="secondary-button generative-read-more"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        Read full guidance and citations
      </button>

      {isOpen ? (
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

function getCompactAnswer(answer: string) {
  const normalized = answer.trim();

  if (normalized.length <= 260) {
    return normalized;
  }

  return `${normalized.slice(0, 260).trimEnd()}...`;
}
