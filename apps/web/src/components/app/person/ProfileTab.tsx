import { useState, type FormEvent } from 'react';
import { validatePerson, type FieldErrors, type PersonInput } from '@vireluma/domain';
import { updatePerson } from '../../../lib/backend/data';
import { ActionError, Panel, useAction, useApp, useFlash } from '../kit';
import { PersonFields, readPersonInput } from '../PersonFields';
import { SubmitButton } from '../ui';
import type { TabProps } from '../PersonIsland';

export function ProfileTab({ ws, reload }: TabProps) {
  const { t } = useApp();
  const action = useAction();
  const { flash, node } = useFlash();
  const [errors, setErrors] = useState<FieldErrors<PersonInput>>({});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = readPersonInput(new FormData(event.currentTarget));
    const found = validatePerson(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    void action.run(async () => {
      await updatePerson(ws.person.id, {
        preferred_name: input.preferredName,
        full_name: input.fullName || null,
        date_of_birth: input.dateOfBirth || null,
        preferred_locale: input.preferredLocale,
        country_code: input.countryCode,
        emergency_message: input.emergencyMessage || null,
      });
      await reload();
      flash(t.common.saved);
    });
  };

  return (
    <Panel title={t.person.profile.title}>
      <form className="grid max-w-2xl gap-6" onSubmit={onSubmit} noValidate>
        <ActionError code={action.error} />
        <PersonFields initial={ws.person} errors={errors} />
        {node}
        <div className="sm:max-w-xs">
          <SubmitButton busy={action.busy}>{t.common.save}</SubmitButton>
        </div>
      </form>
    </Panel>
  );
}
