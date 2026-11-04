import { useState, type FormEvent } from 'react';
import { POLICY_VERSION, validatePerson, type FieldErrors, type PersonInput } from '@vireluma/domain';
import { createPerson } from '../../lib/backend/data';
import { AppRoot, type IslandProps } from './AppRoot';
import { ActionError, Check, Loading, personHref, useAction, useApp, useSession } from './kit';
import { PersonFields, readPersonInput } from './PersonFields';
import { FormMessage, SubmitButton } from './ui';

export default function NewPersonIsland(props: IslandProps) {
  return (
    <AppRoot {...props}>
      <NewPerson />
    </AppRoot>
  );
}

/**
 * Step 1 of setup. The person is created on the server right away, so the
 * remaining steps (contacts, details, code) resume from server data on any
 * device — no client-side draft to lose.
 */
function NewPerson() {
  const { t, paths } = useApp();
  const session = useSession();
  const action = useAction();
  const [errors, setErrors] = useState<FieldErrors<PersonInput>>({});
  const [isMinor, setIsMinor] = useState(false);
  const [consentMissing, setConsentMissing] = useState(false);

  if (session.loading) return <Loading label={t.loading} />;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = readPersonInput(data);
    const found = validatePerson(input);
    const consent = data.get('consent') === 'on';
    const guardian = data.get('guardian') === 'on';
    setErrors(found);
    setConsentMissing(!consent || (isMinor && !guardian));
    if (Object.keys(found).length > 0 || !consent || (isMinor && !guardian)) return;
    void action.run(async () => {
      const id = await createPerson({
        preferredName: input.preferredName,
        policyVersion: POLICY_VERSION,
        isMinor,
        guardianConfirmed: guardian,
        fullName: input.fullName || null,
        dateOfBirth: input.dateOfBirth || null,
        preferredLocale: input.preferredLocale,
        countryCode: input.countryCode,
        emergencyMessage: input.emergencyMessage || null,
      });
      window.location.assign(personHref(paths, 'person', id, 'contacts'));
    });
  };

  return (
    <form className="grid gap-6" onSubmit={onSubmit} noValidate>
      <ActionError code={action.error} />
      <PersonFields initial={null} errors={errors} />
      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="px-1 text-sm font-semibold">{t.newPerson.consentTitle}</legend>
        <Check name="minor" label={t.newPerson.minorLabel} checked={isMinor} onChange={setIsMinor} />
        {isMinor && <Check name="guardian" label={t.newPerson.guardianLabel} required />}
        <Check name="consent" label={t.newPerson.consentProcessing} required />
        <p className="text-sm text-fg-muted">{t.common.draftNotice}</p>
      </fieldset>
      {consentMissing && <FormMessage tone="danger">{t.newPerson.consentRequired}</FormMessage>}
      <SubmitButton busy={action.busy}>{t.newPerson.submit}</SubmitButton>
    </form>
  );
}
