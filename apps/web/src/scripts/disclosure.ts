/**
 * Progressive enhancement for <details data-dropdown> menus: close on Escape
 * (returning focus to the trigger), on outside click, and when another opens.
 * Without JavaScript the native disclosure still works.
 */
export function initDropdowns(): void {
  const dropdowns = () => [...document.querySelectorAll<HTMLDetailsElement>('details[data-dropdown]')];

  document.addEventListener('click', (event) => {
    for (const d of dropdowns()) {
      if (d.open && !d.contains(event.target as Node)) d.open = false;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    for (const d of dropdowns()) {
      if (!d.open) continue;
      d.open = false;
      d.querySelector('summary')?.focus();
    }
  });

  for (const d of dropdowns()) {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      for (const other of dropdowns()) if (other !== d) other.open = false;
    });
  }
}
