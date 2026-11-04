import { useMemo } from 'react';
import {
  COUNTRY_CODES,
  LIMITS,
  LOCALES,
  isCountryCode,
  isLocale,
  type FieldErrors,
  type Locale,
  type Person,
  type PersonInput,
} from '@vireluma/domain';
import { countryName, fmt } from '../../i18n/format';
import { Select, TextArea, useApp } from './kit';
import { Field } from './ui';

/** Language name in its own locale-appropriate form, capitalised (e.g. "Español"). */
export function languageName(code: Locale, inLocale: Locale): string {
  try {
    const name = new Intl.DisplayNames([inLocale], { type: 'language' }).of(code) ?? code;
    return name.charAt(0).toLocaleUpperCase(inLocale) + name.slice(1);
  } catch {
    return code;
  }
}

export function useCountryOptions(includeNone: boolean) {
  const { t, locale } = useApp();
  return useMemo(() => {
    const options = COUNTRY_CODES.map((code) => ({ value: code, label: countryName(code, locale) })).sort(
      (a, b) => a.label.localeCompare(b.label, locale),
    );
    return includeNone ? [{ value: '', label: t.form.countryNone }, ...options] : options;
  }, [locale, includeNone, t.form.countryNone]);
}

/** Reads the person fields of a submitted form. */
export function readPersonInput(data: FormData): PersonInput {
  const get = (name: string) => String(data.get(name) ?? '');
  const country = get('country');
  const locale = get('preferredLocale');
  return {
    preferredName: get('preferredName').trim(),
    fullName: get('fullName').trim(),
    dateOfBirth: get('dateOfBirth'),
    preferredLocale: (isLocale(locale) ? locale : 'es') as Locale,
    countryCode: isCountryCode(country) ? country : null,
    emergencyMessage: get('emergencyMessage').trim(),
  };
}

/** Basic person fields, shared by the creation form and the profile editor. */
export function PersonFields({
  initial,
  errors,
}: {
  initial: Person | null;
  errors: FieldErrors<PersonInput>;
}) {
  const { t, locale } = useApp();
  const countries = useCountryOptions(true);
  const err = (key: keyof PersonInput) => (errors[key] ? t.fieldErrors[errors[key]] : null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-5">
      <Field
        label={t.form.preferredName}
        hint={t.form.preferredNameHint}
        name="preferredName"
        defaultValue={initial?.preferred_name ?? ''}
        maxLength={LIMITS.preferredName}
        autoComplete="off"
        required
        error={err('preferredName')}
      />
      <TextArea
        label={t.form.emergencyMessage}
        hint={t.form.emergencyMessageHint}
        name="emergencyMessage"
        defaultValue={initial?.emergency_message ?? ''}
        maxLength={LIMITS.emergencyMessage}
        error={err('emergencyMessage')}
        counter={(remaining) => fmt(t.form.remaining, { count: remaining })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label={t.form.country}
          hint={t.form.countryHint}
          name="country"
          defaultValue={initial?.country_code ?? (locale === 'es' ? 'CO' : '')}
          options={countries}
          error={err('countryCode')}
        />
        <Select
          label={t.form.personLocale}
          name="preferredLocale"
          defaultValue={initial?.preferred_locale ?? locale}
          options={LOCALES.map((l) => ({ value: l, label: languageName(l, locale) }))}
          error={err('preferredLocale')}
        />
      </div>
      <Field
        label={`${t.form.fullName} ${t.common.optional}`}
        hint={t.form.fullNameHint}
        name="fullName"
        defaultValue={initial?.full_name ?? ''}
        maxLength={LIMITS.fullName}
        autoComplete="off"
        error={err('fullName')}
      />
      <Field
        label={`${t.form.dateOfBirth} ${t.common.optional}`}
        hint={t.form.dateOfBirthHint}
        name="dateOfBirth"
        type="date"
        min="1900-01-02"
        max={today}
        defaultValue={initial?.date_of_birth ?? ''}
        error={err('dateOfBirth')}
      />
    </div>
  );
}
