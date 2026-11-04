/**
 * Shared class recipes so Astro (static) and React (interactive) components
 * render identical styles from the same tokens.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap no-underline ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out ' +
  'active:translate-y-px disabled:cursor-not-allowed aria-disabled:cursor-not-allowed ' +
  'disabled:bg-disabled-bg disabled:text-disabled-fg disabled:border-transparent disabled:shadow-none ' +
  'aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg aria-disabled:border-transparent ' +
  'hover:no-underline';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary shadow-sm hover:bg-primary-hover',
  secondary: 'bg-secondary text-on-secondary shadow-sm hover:bg-secondary-hover',
  outline: 'border border-border-strong bg-surface text-fg hover:border-primary hover:text-primary',
  ghost: 'text-fg hover:bg-bg-subtle',
  danger: 'bg-danger text-white shadow-sm hover:brightness-95 dark:text-[#2a0a0a]',
  inverse: 'bg-white text-[#102A43] shadow-sm hover:bg-[#ecfaf7]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[var(--vl-control-sm)] px-4 text-sm',
  md: 'min-h-[var(--vl-control-md)] px-5 text-base',
  lg: 'min-h-[var(--vl-control-lg)] px-7 text-lg',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = ''): string {
  return [BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], extra].filter(Boolean).join(' ');
}

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export const TONE_SOFT: Record<Tone, string> = {
  neutral: 'bg-bg-subtle text-fg',
  primary: 'bg-primary-soft text-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-fg',
};

export const FIELD_CONTROL =
  'block w-full rounded-md border border-border-strong bg-surface px-3.5 text-base text-fg ' +
  'placeholder:text-fg-muted transition-[border-color,box-shadow] duration-150 ' +
  'hover:border-fg-muted focus-visible:outline-none focus-visible:border-focus ' +
  'focus-visible:ring-[3px] focus-visible:ring-focus/30 ' +
  'disabled:bg-disabled-bg disabled:text-disabled-fg disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/25';
