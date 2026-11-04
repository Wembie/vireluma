import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  items: TabItem[];
  defaultTab?: string;
}

/**
 * WAI-ARIA tabs with roving tabindex and automatic activation
 * (Arrow keys, Home, End). Interactive island — hydrate with client:visible.
 */
export function Tabs({ label, items, defaultTab }: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = (index: number) => {
    const next = (index + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    setActive(item.id);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusAt(index + 1),
      ArrowLeft: () => focusAt(index - 1),
      Home: () => focusAt(0),
      End: () => focusAt(items.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
        {items.map((item, i) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(item.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                selected ? 'border-primary text-primary' : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          // WAI-ARIA APG: a tab panel is focusable so keyboard users can reach plain-text content.
          // eslint-disable-next-line jsx-a11y-x/no-noninteractive-tabindex
          tabIndex={0}
          className="pt-5"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
