import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import type { Locale } from '@vireluma/domain';
import type { AppPage, Dictionary } from '../../i18n';
import { DataError, getSessionEmail, type DataErrorCode } from '../../lib/backend/data';
import { FIELD_CONTROL, TONE_SOFT, buttonClass, type Tone } from '../ui/variants';
import { FormMessage } from './ui';

/**
 * Building blocks shared by the account-area islands: context, data hooks and
 * accessible form/feedback primitives that reuse the design-system recipes.
 */

export type AppStrings = Dictionary['app'];

export interface AppContextValue {
  t: AppStrings;
  locale: Locale;
  paths: Record<AppPage, string>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp outside AppProvider');
  return value;
}

/** URL of a person-scoped page (`?id=` is an internal key, never personal data). */
export function personHref(paths: Record<AppPage, string>, page: 'person' | 'qr', id: string, tab?: string) {
  const params = new URLSearchParams({ id });
  if (tab) params.set('tab', tab);
  return `${paths[page]}?${params.toString()}`;
}

export const errorCode = (error: unknown): DataErrorCode =>
  error instanceof DataError ? error.code : 'unknown';

// ── Session ──────────────────────────────────────────────────────────────────

/** Signed-in user or a redirect to the login page (with an allow-listed return target). */
export function useSession(next?: 'invite') {
  const { paths } = useApp();
  const [state, setState] = useState<{ loading: boolean; user: { id: string; email: string } | null }>({
    loading: true,
    user: null,
  });
  useEffect(() => {
    let active = true;
    void getSessionEmail()
      .catch(() => null)
      .then((user) => {
        if (!active) return;
        if (!user) {
          window.location.replace(next ? `${paths.login}?next=${next}` : paths.login);
          return;
        }
        setState({ loading: false, user });
      });
    return () => {
      active = false;
    };
  }, [paths.login, next]);
  return state;
}

// ── Data hooks ───────────────────────────────────────────────────────────────

export interface Resource<T> {
  data: T | null;
  error: DataErrorCode | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Loads data, ignores stale responses, and sends expired sessions to the login page. */
export function useResource<T>(load: (() => Promise<T>) | null, deps: unknown[]): Resource<T> {
  const { paths } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<DataErrorCode | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const loader = useRef(load);
  loader.current = load;

  const reload = useCallback(async () => {
    const run = loader.current;
    if (!run) return;
    const id = ++seq.current;
    setLoading(true);
    try {
      const value = await run();
      if (id !== seq.current) return;
      setData(value);
      setError(null);
    } catch (e) {
      if (id !== seq.current) return;
      const code = errorCode(e);
      if (code === 'unauthenticated') window.location.replace(paths.login);
      setError(code);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [paths.login]);

  useEffect(() => {
    void reload();
  }, deps);

  return { data, error, loading, reload };
}

/** Runs one mutation at a time and exposes busy/error state for the form. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<DataErrorCode | null>(null);
  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    setBusy(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (e) {
      setError(errorCode(e));
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export function Loading({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-10 text-fg-muted">
      <span
        className="size-5 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        aria-hidden="true"
      />
      {label}
    </div>
  );
}

export function ErrorView({ code, onRetry }: { code: DataErrorCode; onRetry?: () => void }) {
  const { t } = useApp();
  return (
    <div className="grid gap-4">
      <FormMessage tone="danger">{t.dataErrors[code]}</FormMessage>
      {onRetry && (
        <div>
          <button type="button" className={buttonClass('outline', 'md')} onClick={onRetry}>
            {t.common.retry}
          </button>
        </div>
      )}
    </div>
  );
}

export function ActionError({ code }: { code: DataErrorCode | null }) {
  const { t } = useApp();
  return code ? <FormMessage tone="danger">{t.dataErrors[code]}</FormMessage> : null;
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold ${TONE_SOFT[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({
  title,
  lead,
  actions,
  children,
  headingLevel = 2,
}: {
  title: string;
  lead?: string;
  actions?: ReactNode;
  children: ReactNode;
  headingLevel?: 2 | 3;
}) {
  const id = useId();
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby={id} className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <Heading id={id} className="text-h4">
            {title}
          </Heading>
          {lead && <p className="text-fg-muted">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ── Form controls ────────────────────────────────────────────────────────────

interface ControlShell {
  label: string;
  hint?: string | undefined;
  error?: string | null | undefined;
}

function useDescribedBy(id: string, hint?: string, error?: string | null, extra?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`, extra].filter(Boolean).join(' ') || undefined;
}

function Shell({ id, label, hint, error, children }: ControlShell & { id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-fg">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  counter,
  ...props
}: ControlShell & { counter?: (remaining: number) => string } & Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'className'
  >) {
  const id = useId();
  const [length, setLength] = useState(String(props.defaultValue ?? props.value ?? '').length);
  const max = props.maxLength;
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={3}
        className={`${FIELD_CONTROL} min-h-24 py-2.5`}
        aria-describedby={useDescribedBy(id, hint, error, counter && max ? `${id}-count` : undefined)}
        aria-invalid={error ? true : undefined}
        {...props}
        onChange={(e) => {
          setLength(e.target.value.length);
          props.onChange?.(e);
        }}
      />
      {counter && max !== undefined && (
        <p id={`${id}-count`} className="text-right text-xs text-fg-muted" aria-live="polite">
          {counter(max - length)}
        </p>
      )}
    </Shell>
  );
}

export function Select({
  label,
  hint,
  error,
  options,
  ...props
}: ControlShell & {
  options: { value: string; label: string }[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>) {
  const id = useId();
  return (
    <Shell id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className={`${FIELD_CONTROL} h-[var(--vl-control-lg)]`}
        aria-describedby={useDescribedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function Check({
  label,
  hint,
  name,
  checked,
  defaultChecked,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  required?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        className="mt-0.5 size-6 shrink-0 accent-[var(--vl-primary)]"
        checked={checked}
        defaultChecked={defaultChecked}
        required={required}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <div className="grid gap-1">
        <label htmlFor={id} className="cursor-pointer text-fg">
          {label}
        </label>
        {hint && (
          <p id={`${id}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Dialogs ──────────────────────────────────────────────────────────────────

/**
 * Modal built on native <dialog> (focus trap, Esc and inert background come
 * from the browser). Focus returns to the opener when it closes.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      if (opener.current instanceof HTMLElement) opener.current.focus();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-0 text-fg shadow-lg backdrop:bg-black/50"
    >
      {open && (
        <div className="grid gap-5 p-6">
          <h2 id={id} className="text-h4">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  tone = 'danger',
  busy,
  error,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  busy: boolean;
  error: DataErrorCode | null;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const { t } = useApp();
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-fg">{body}</p>
      {children}
      <ActionError code={error} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className={buttonClass('outline', 'md')} onClick={onClose}>
          {t.common.cancel}
        </button>
        <button
          type="button"
          className={buttonClass(tone, 'md')}
          onClick={onConfirm}
          disabled={busy}
          aria-busy={busy}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/** Polite announcement for successful saves (WCAG 4.1.3 status messages). */
export function useFlash(timeout = 5000) {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), timeout);
    return () => clearTimeout(timer);
  }, [message, timeout]);
  // The live region exists before the message so screen readers announce it.
  const node = (
    <div aria-live="polite">
      {message && (
        <p className="rounded-md border border-current/15 bg-success-soft p-4 text-sm font-medium text-success">
          {message}
        </p>
      )}
    </div>
  );
  return { flash: setMessage, node };
}
