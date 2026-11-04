import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { FIELD_CONTROL, buttonClass, type ButtonVariant } from '../ui/variants';

/** React counterparts of the design-system form primitives (same tokens and recipes). */

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  hint?: string;
  error?: string | null;
  showPasswordLabel?: string;
}

export function Field({ label, hint, error, showPasswordLabel, type = 'text', ...input }: FieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const isPassword = type === 'password';

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
      <input
        id={id}
        type={isPassword && reveal ? 'text' : type}
        className={`${FIELD_CONTROL} h-[var(--vl-control-lg)] text-lg`}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...input}
      />
      {isPassword && showPasswordLabel && (
        <label className="flex min-h-[var(--vl-touch-min)] cursor-pointer items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            className="size-5 accent-[var(--vl-primary)]"
            checked={reveal}
            onChange={(e) => setReveal(e.target.checked)}
          />
          {showPasswordLabel}
        </label>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  busy,
  variant = 'primary',
}: {
  children: ReactNode;
  busy: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <button type="submit" className={buttonClass(variant, 'lg', 'w-full')} disabled={busy} aria-busy={busy}>
      {busy && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

/** Form-level message, announced to screen readers when it appears. */
export function FormMessage({
  tone,
  children,
}: {
  tone: 'danger' | 'success' | 'info';
  children: ReactNode;
}) {
  const tones = {
    danger: 'bg-danger-soft text-danger',
    success: 'bg-success-soft text-success',
    info: 'bg-info-soft text-info',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-md border border-current/15 p-4 text-sm font-medium ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
