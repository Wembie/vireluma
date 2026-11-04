import { useId } from 'react';
import { ArrowDown, ArrowUp, Eye, Lock } from 'lucide-react';
import { VISIBILITIES, type Visibility } from '@vireluma/domain';
import { fmt } from '../../../i18n/format';
import { useApp, Badge } from '../kit';

/** Radio group for who may see an item; defaults are chosen by the caller (privacy first). */
export function VisibilityField({ defaultValue }: { defaultValue: Visibility }) {
  const { t } = useApp();
  const id = useId();
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-semibold text-fg">{t.form.visibility}</legend>
      {VISIBILITIES.map((v) => (
        <div key={v} className="flex gap-3 rounded-md border border-border p-3">
          <input
            id={`${id}-${v}`}
            type="radio"
            name="visibility"
            value={v}
            defaultChecked={defaultValue === v}
            className="mt-0.5 size-5 shrink-0 accent-[var(--vl-primary)]"
            aria-describedby={`${id}-${v}-hint`}
          />
          <div className="grid gap-0.5">
            <label htmlFor={`${id}-${v}`} className="cursor-pointer font-semibold text-fg">
              {t.visibility[v]}
            </label>
            <p id={`${id}-${v}-hint`} className="text-sm text-fg-muted">
              {t.visibilityHelp[v]}
            </p>
          </div>
        </div>
      ))}
    </fieldset>
  );
}

export function VisibilityBadge({ value }: { value: Visibility }) {
  const { t } = useApp();
  const isPublic = value === 'public_emergency';
  return (
    <Badge tone={isPublic ? 'accent' : 'neutral'}>
      {isPublic ? (
        <Eye className="mr-1 size-3.5" aria-hidden="true" />
      ) : (
        <Lock className="mr-1 size-3.5" aria-hidden="true" />
      )}
      {t.visibility[value]}
    </Badge>
  );
}

/** Up/down controls: keyboard and screen-reader friendly alternative to drag and drop. */
export function ReorderControls({
  name,
  index,
  count,
  disabled,
  onMove,
}: {
  name: string;
  index: number;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const { t } = useApp();
  const btn =
    'inline-flex size-[var(--vl-touch-min)] items-center justify-center rounded-md text-fg-muted hover:bg-bg-subtle hover:text-fg disabled:opacity-40';
  return (
    <div className="flex">
      <button
        type="button"
        className={btn}
        disabled={disabled || index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={fmt(t.common.moveUp, { name })}
      >
        <ArrowUp className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className={btn}
        disabled={disabled || index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={fmt(t.common.moveDown, { name })}
      >
        <ArrowDown className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

export function moved<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

export const readVisibility = (data: FormData): Visibility =>
  data.get('visibility') === 'public_emergency' ? 'public_emergency' : 'private';
