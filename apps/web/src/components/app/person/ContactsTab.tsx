import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Phone, Plus, Trash } from 'lucide-react';
import {
  LIMITS,
  can,
  formatPhone,
  isCountryCode,
  normalizePhone,
  validateContact,
  type ContactInput,
  type EmergencyContact,
  type FieldErrors,
} from '@vireluma/domain';
import { fmt } from '../../../i18n/format';
import { addContact, deleteContact, reorderContacts, updateContact } from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, ConfirmDialog, Modal, Panel, useAction, useApp } from '../kit';
import { Field, SubmitButton } from '../ui';
import type { TabProps } from '../PersonIsland';
import { ReorderControls, VisibilityBadge, VisibilityField, moved, readVisibility } from './shared';

type Editing = { mode: 'add' } | { mode: 'edit'; contact: EmergencyContact } | null;

export function ContactsTab({ ws, reload }: TabProps) {
  const { t } = useApp();
  const canEdit = can(ws.my_role, 'manageEmergencyInfo');
  const [order, setOrder] = useState(ws.contacts);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<EmergencyContact | null>(null);
  const reorder = useAction();
  const remove = useAction();

  useEffect(() => setOrder(ws.contacts), [ws.contacts]);

  const atLimit = ws.contacts.length >= LIMITS.contactsPerPerson;

  const move = (from: number, to: number) => {
    const previous = order;
    const next = moved(order, from, to);
    setOrder(next); // optimistic
    void reorder
      .run(async () => {
        await reorderContacts(
          ws.person.id,
          next.map((c) => c.id),
        );
        await reload();
      })
      .then((ok) => {
        if (!ok) setOrder(previous);
      });
  };

  return (
    <Panel
      title={t.person.contacts.title}
      lead={t.person.contacts.lead}
      actions={
        canEdit && (
          <button
            type="button"
            className={buttonClass('primary', 'md')}
            onClick={() => setEditing({ mode: 'add' })}
            disabled={atLimit}
          >
            <Plus className="size-5" aria-hidden="true" />
            {t.person.contacts.add}
          </button>
        )
      }
    >
      <div className="grid gap-4">
        <ActionError code={reorder.error} />
        {atLimit && canEdit && (
          <p className="text-sm text-fg-muted">
            {fmt(t.person.contacts.limit, { max: LIMITS.contactsPerPerson })}
          </p>
        )}
        {order.length === 0 ? (
          <p className="text-fg-muted">{t.person.contacts.empty}</p>
        ) : (
          <ol className="grid gap-3">
            {order.map((c, i) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="font-semibold break-words text-fg">
                    {c.name}
                    {c.relationship && <span className="font-normal text-fg-muted"> · {c.relationship}</span>}
                  </p>
                  <p className="flex items-center gap-2 text-fg">
                    <Phone className="size-4 text-fg-muted" aria-hidden="true" />
                    <a href={`tel:${c.phone_e164}`} className="tabular-nums">
                      {formatPhone(c.phone_e164)}
                    </a>
                  </p>
                  <div>
                    <VisibilityBadge value={c.visibility} />
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <ReorderControls
                      name={c.name}
                      index={i}
                      count={order.length}
                      disabled={reorder.busy}
                      onMove={move}
                    />
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      onClick={() => setEditing({ mode: 'edit', contact: c })}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      {t.common.edit}
                      <span className="sr-only">: {c.name}</span>
                    </button>
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      onClick={() => setDeleting(c)}
                    >
                      <Trash className="size-4" aria-hidden="true" />
                      {t.common.delete}
                      <span className="sr-only">: {c.name}</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      <Modal
        open={editing !== null}
        title={editing?.mode === 'edit' ? t.person.contacts.editTitle : t.person.contacts.addTitle}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <ContactForm
            personId={ws.person.id}
            country={ws.person.country_code}
            contact={editing.mode === 'edit' ? editing.contact : null}
            nextPriority={Math.min(ws.contacts.length + 1, LIMITS.contactsPerPerson)}
            onDone={async () => {
              setEditing(null);
              await reload();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title={fmt(t.person.contacts.deleteTitle, { name: deleting?.name ?? '' })}
        body={t.person.contacts.deleteBody}
        confirmLabel={t.common.delete}
        busy={remove.busy}
        error={remove.error}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          void remove.run(async () => {
            if (deleting) await deleteContact(deleting.id);
            setDeleting(null);
            await reload();
          })
        }
      />
    </Panel>
  );
}

function ContactForm({
  personId,
  country,
  contact,
  nextPriority,
  onDone,
  onCancel,
}: {
  personId: string;
  country: string | null;
  contact: EmergencyContact | null;
  nextPriority: number;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const action = useAction();
  const [phone, setPhone] = useState(contact ? formatPhone(contact.phone_e164) : '');
  const [errors, setErrors] = useState<FieldErrors<ContactInput>>({});
  const normalized = normalizePhone(phone, isCountryCode(country) ? country : null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: ContactInput = {
      name: String(data.get('name') ?? '').trim(),
      relationship: String(data.get('relationship') ?? '').trim(),
      phoneE164: normalized,
      visibility: readVisibility(data),
    };
    const found = validateContact(input);
    setErrors(found);
    if (Object.keys(found).length > 0 || !input.phoneE164) return;
    const fields = {
      name: input.name,
      relationship: input.relationship || null,
      phone_e164: input.phoneE164,
      visibility: input.visibility,
    };
    void action.run(async () => {
      if (contact) await updateContact(contact.id, fields);
      else await addContact(personId, fields, nextPriority);
      await onDone();
    });
  };

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <ActionError code={action.error} />
      <Field
        label={t.form.contactName}
        name="name"
        defaultValue={contact?.name ?? ''}
        maxLength={LIMITS.contactName}
        autoComplete="off"
        required
        error={errors.name ? t.fieldErrors[errors.name] : null}
      />
      <Field
        label={`${t.form.relationship} ${t.common.optional}`}
        hint={t.form.relationshipHint}
        name="relationship"
        defaultValue={contact?.relationship ?? ''}
        maxLength={LIMITS.relationship}
        autoComplete="off"
        error={errors.relationship ? t.fieldErrors[errors.relationship] : null}
      />
      <div className="grid gap-1.5">
        <Field
          label={t.form.phone}
          hint={t.form.phoneHint}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          error={errors.phoneE164 ? t.form.phoneInvalid : null}
        />
        {normalized && (
          <p className="text-sm text-fg" aria-live="polite">
            {fmt(t.form.phonePreview, { phone: formatPhone(normalized) })}
          </p>
        )}
      </div>
      <VisibilityField defaultValue={contact?.visibility ?? 'public_emergency'} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className={buttonClass('outline', 'md')} onClick={onCancel}>
          {t.common.cancel}
        </button>
        <div>
          <SubmitButton busy={action.busy}>{t.common.save}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
