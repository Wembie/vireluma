import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus, Trash } from 'lucide-react';
import {
  DETAIL_KINDS,
  LIMITS,
  can,
  isHealthKind,
  validateDetail,
  type DetailInput,
  type DetailKind,
  type EmergencyDetail,
  type FieldErrors,
} from '@vireluma/domain';
import { fmt } from '../../../i18n/format';
import { addDetail, deleteDetail, reorderDetails, updateDetail } from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, Badge, ConfirmDialog, Modal, Panel, Select, TextArea, useAction, useApp } from '../kit';
import { Field, SubmitButton } from '../ui';
import type { TabProps } from '../PersonIsland';
import { ReorderControls, VisibilityBadge, VisibilityField, moved, readVisibility } from './shared';

type Editing = { mode: 'add' } | { mode: 'edit'; detail: EmergencyDetail } | null;

export function DetailsTab({ ws, reload, go }: TabProps) {
  const { t } = useApp();
  const canEdit = can(ws.my_role, 'manageEmergencyInfo');
  const healthConsent = ws.consents.some((c) => c.purpose === 'health_data');
  const [order, setOrder] = useState(ws.details);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<EmergencyDetail | null>(null);
  const reorder = useAction();
  const remove = useAction();

  useEffect(() => setOrder(ws.details), [ws.details]);
  const atLimit = ws.details.length >= LIMITS.detailsPerPerson;

  const move = (from: number, to: number) => {
    const previous = order;
    const next = moved(order, from, to);
    setOrder(next);
    void reorder
      .run(async () => {
        await reorderDetails(
          ws.person.id,
          next.map((d) => d.id),
        );
        await reload();
      })
      .then((ok) => {
        if (!ok) setOrder(previous);
      });
  };

  return (
    <Panel
      title={t.person.details.title}
      lead={t.person.details.lead}
      actions={
        canEdit && (
          <button
            type="button"
            className={buttonClass('primary', 'md')}
            onClick={() => setEditing({ mode: 'add' })}
            disabled={atLimit}
          >
            <Plus className="size-5" aria-hidden="true" />
            {t.person.details.add}
          </button>
        )
      }
    >
      <div className="grid gap-4">
        <ActionError code={reorder.error} />
        {canEdit && !healthConsent && (
          <p className="rounded-md bg-info-soft p-4 text-sm text-fg">
            {t.person.details.healthLocked}{' '}
            {can(ws.my_role, 'manageConsent') && (
              <button
                type="button"
                className="font-semibold text-primary underline"
                onClick={() => go('settings')}
              >
                {t.person.tabs.settings}
              </button>
            )}
          </p>
        )}
        {atLimit && canEdit && (
          <p className="text-sm text-fg-muted">
            {fmt(t.person.details.limit, { max: LIMITS.detailsPerPerson })}
          </p>
        )}
        {order.length === 0 ? (
          <p className="text-fg-muted">{t.person.details.empty}</p>
        ) : (
          <ol className="grid gap-3">
            {order.map((d, i) => (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-border p-4"
              >
                <div className="grid min-w-0 gap-1.5">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={isHealthKind(d.kind) ? 'danger' : 'primary'}>{t.detailKinds[d.kind]}</Badge>
                    <VisibilityBadge value={d.visibility} />
                  </div>
                  <p className="font-semibold break-words text-fg">{d.title}</p>
                  {d.details && <p className="break-words whitespace-pre-line text-fg-muted">{d.details}</p>}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <ReorderControls
                      name={d.title}
                      index={i}
                      count={order.length}
                      disabled={reorder.busy}
                      onMove={move}
                    />
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      onClick={() => setEditing({ mode: 'edit', detail: d })}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      {t.common.edit}
                      <span className="sr-only">: {d.title}</span>
                    </button>
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      onClick={() => setDeleting(d)}
                    >
                      <Trash className="size-4" aria-hidden="true" />
                      {t.common.delete}
                      <span className="sr-only">: {d.title}</span>
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
        title={editing?.mode === 'edit' ? t.person.details.editTitle : t.person.details.addTitle}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <DetailForm
            personId={ws.person.id}
            detail={editing.mode === 'edit' ? editing.detail : null}
            healthConsent={healthConsent}
            nextOrder={ws.details.length + 1}
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
        title={fmt(t.person.details.deleteTitle, { title: deleting?.title ?? '' })}
        body={t.person.details.deleteBody}
        confirmLabel={t.common.delete}
        busy={remove.busy}
        error={remove.error}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          void remove.run(async () => {
            if (deleting) await deleteDetail(deleting.id);
            setDeleting(null);
            await reload();
          })
        }
      />
    </Panel>
  );
}

function DetailForm({
  personId,
  detail,
  healthConsent,
  nextOrder,
  onDone,
  onCancel,
}: {
  personId: string;
  detail: EmergencyDetail | null;
  healthConsent: boolean;
  nextOrder: number;
  onDone: () => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const action = useAction();
  const [errors, setErrors] = useState<FieldErrors<DetailInput>>({});
  // Health kinds are only offered with active health-data consent (the database enforces it too).
  const kinds = DETAIL_KINDS.filter((k) => healthConsent || !isHealthKind(k) || detail?.kind === k);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: DetailInput = {
      kind: String(data.get('kind')) as DetailKind,
      title: String(data.get('title') ?? '').trim(),
      details: String(data.get('details') ?? '').trim(),
      visibility: readVisibility(data),
    };
    const found = validateDetail(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const fields = { ...input, details: input.details || null };
    void action.run(async () => {
      if (detail) await updateDetail(detail.id, fields);
      else await addDetail(personId, fields, nextOrder);
      await onDone();
    });
  };

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <ActionError code={action.error} />
      <Select
        label={t.form.detailKind}
        name="kind"
        defaultValue={detail?.kind ?? 'communication'}
        options={kinds.map((k) => ({ value: k, label: t.detailKinds[k] }))}
        error={errors.kind ? t.fieldErrors[errors.kind] : null}
      />
      <Field
        label={t.form.detailTitle}
        name="title"
        defaultValue={detail?.title ?? ''}
        maxLength={LIMITS.detailTitle}
        autoComplete="off"
        required
        error={errors.title ? t.fieldErrors[errors.title] : null}
      />
      <TextArea
        label={`${t.form.detailBody} ${t.common.optional}`}
        name="details"
        defaultValue={detail?.details ?? ''}
        maxLength={LIMITS.detailBody}
        error={errors.details ? t.fieldErrors[errors.details] : null}
        counter={(remaining) => fmt(t.form.remaining, { count: remaining })}
      />
      {/* Private by default: showing information publicly is an explicit choice. */}
      <VisibilityField defaultValue={detail?.visibility ?? 'private'} />
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
