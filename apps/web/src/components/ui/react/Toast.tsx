import { useCallback, useEffect, useRef, useState } from 'react';

type ToastTone = 'success' | 'info' | 'danger';

interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
}

const TONES: Record<ToastTone, string> = {
  success: 'border-l-success',
  info: 'border-l-info',
  danger: 'border-l-danger',
};

/**
 * Toast region. Messages are announced through a polite live region (errors
 * assertively) and stay until dismissed or 6 s pass — paused while hovered or
 * focused (WCAG 2.2.1). Never use a toast for information the user must act on.
 */
export function ToastDemo({
  triggerLabel,
  dismissLabel,
  messages,
}: {
  triggerLabel: string;
  dismissLabel: string;
  messages: { tone: ToastTone; text: string }[];
}) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);
  const paused = useRef(false);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = () => {
    const template = messages[counter.current % messages.length];
    if (!template) return;
    counter.current += 1;
    setToasts((t) => [...t.slice(-2), { id: counter.current, ...template }]);
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = window.setInterval(() => {
      if (!paused.current) setToasts((t) => t.slice(1));
    }, 6000);
    return () => window.clearInterval(timer);
  }, [toasts.length]);

  return (
    <>
      <button
        type="button"
        onClick={push}
        className="inline-flex min-h-[var(--vl-control-md)] items-center rounded-pill border border-border-strong bg-surface px-5 font-semibold text-fg hover:border-primary hover:text-primary"
      >
        {triggerLabel}
      </button>
      {/* Hover/focus only pause auto-dismiss (WCAG 2.2.1); the region itself is not a control. */}
      {/* eslint-disable-next-line jsx-a11y-x/no-static-element-interactions */}
      <div
        className="fixed right-4 bottom-4 left-4 z-[var(--vl-z-toast)] flex flex-col items-end gap-3 sm:left-auto"
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
      >
        <div role="status" aria-live="polite" className="contents">
          {toasts
            .filter((t) => t.tone !== 'danger')
            .map((t) => (
              <ToastCard key={t.id} toast={t} dismissLabel={dismissLabel} onDismiss={dismiss} />
            ))}
        </div>
        <div role="alert" aria-live="assertive" className="contents">
          {toasts
            .filter((t) => t.tone === 'danger')
            .map((t) => (
              <ToastCard key={t.id} toast={t} dismissLabel={dismissLabel} onDismiss={dismiss} />
            ))}
        </div>
      </div>
    </>
  );
}

function ToastCard({
  toast,
  dismissLabel,
  onDismiss,
}: {
  toast: ToastMessage;
  dismissLabel: string;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className={`flex w-full max-w-sm items-start gap-3 rounded-md border border-l-4 border-border bg-surface p-4 text-fg shadow-lg ${TONES[toast.tone]}`}
    >
      <p className="flex-1 text-sm">{toast.text}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="-m-1 min-h-9 rounded-sm px-2 text-sm font-semibold text-primary hover:underline"
      >
        {dismissLabel}
      </button>
    </div>
  );
}
