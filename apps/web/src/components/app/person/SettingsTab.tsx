import { useState } from 'react';
import { POLICY_VERSION, type ConsentPurpose } from '@vireluma/domain';
import { fmt, formatDate } from '../../../i18n/format';
import {
  deletePerson,
  grantConsent,
  revokeConsent,
  setPersonStatus,
  transferOwnership,
} from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, Check, ConfirmDialog, Panel, Select, useAction, useApp } from '../kit';
import { Field } from '../ui';
import type { TabProps } from '../PersonIsland';

/** Owner-only controls: consent, pause, ownership transfer and deletion. */
export function SettingsTab({ ws, reload }: TabProps) {
  const { t, locale, paths } = useApp();
  const s = t.person.settings;
  const action = useAction();
  const [dialog, setDialog] = useState<'revokeHealth' | 'transfer' | 'delete' | null>(null);
  const [healthAgreed, setHealthAgreed] = useState(false);
  const [newOwner, setNewOwner] = useState('');
  const [confirmName, setConfirmName] = useState('');

  const consent = (purpose: ConsentPurpose) => ws.consents.find((c) => c.purpose === purpose);
  const health = consent('health_data');
  const candidates = ws.members.filter((m) => !m.is_me);
  const suspended = ws.person.status === 'suspended';
  const close = () => {
    setDialog(null);
    action.setError(null);
  };

  const run = (task: () => Promise<void>) =>
    void action.run(async () => {
      await task();
      setDialog(null);
      await reload();
    });

  return (
    <div className="grid gap-6">
      {!dialog && <ActionError code={action.error} />}

      <Panel title={s.consentTitle}>
        <ul className="grid gap-4">
          {ws.consents.map((c) => (
            <li key={c.purpose} className="grid gap-0.5">
              <span className="font-semibold text-fg">{s.purposes[c.purpose]}</span>
              <span className="text-sm text-fg-muted">
                {fmt(s.granted, { date: formatDate(c.granted_at, locale), version: c.policy_version })}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-6 grid gap-3 border-t border-border pt-5">
          <h3 className="font-semibold text-fg">{s.purposes.health_data}</h3>
          <p className="text-fg-muted">{s.healthBody}</p>
          {health ? (
            <div>
              <button
                type="button"
                className={buttonClass('outline', 'sm')}
                onClick={() => setDialog('revokeHealth')}
              >
                {s.healthRevoke}
              </button>
            </div>
          ) : (
            <div className="grid justify-items-start gap-3">
              <Check label={s.healthGrantLabel} checked={healthAgreed} onChange={setHealthAgreed} />
              <button
                type="button"
                className={buttonClass('primary', 'sm')}
                disabled={!healthAgreed || action.busy}
                onClick={() => run(() => grantConsent(ws.person.id, 'health_data', POLICY_VERSION))}
              >
                {s.healthGrant}
              </button>
              <p className="text-sm text-fg-muted">{t.common.draftNotice}</p>
            </div>
          )}
        </div>
      </Panel>

      <Panel title={s.statusTitle} lead={s.statusBody}>
        <button
          type="button"
          className={buttonClass('outline', 'md')}
          disabled={action.busy}
          onClick={() => run(() => setPersonStatus(ws.person.id, suspended ? 'active' : 'suspended'))}
        >
          {suspended ? s.resume : s.pause}
        </button>
      </Panel>

      <Panel title={s.transferTitle} lead={s.transferBody}>
        {candidates.length === 0 ? (
          <p className="text-fg-muted">{s.transferNone}</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-72 max-w-full">
              <Select
                label={s.transferTo}
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                options={[
                  { value: '', label: '—' },
                  ...candidates.map((m) => ({
                    value: m.user_id,
                    label: `${m.display_name || m.email || '—'} (${t.roles[m.role]})`,
                  })),
                ]}
              />
            </div>
            <button
              type="button"
              className={buttonClass('outline', 'md')}
              disabled={!newOwner}
              onClick={() => setDialog('transfer')}
            >
              {s.transfer}
            </button>
          </div>
        )}
      </Panel>

      <Panel title={s.deleteTitle} lead={s.deleteBody}>
        <button type="button" className={buttonClass('danger', 'md')} onClick={() => setDialog('delete')}>
          {s.deleteButton}
        </button>
      </Panel>

      <ConfirmDialog
        open={dialog === 'revokeHealth'}
        title={s.healthRevokeTitle}
        body={s.healthRevokeBody}
        confirmLabel={s.healthRevoke}
        busy={action.busy}
        error={action.error}
        onClose={close}
        onConfirm={() => run(() => revokeConsent(ws.person.id, 'health_data'))}
      />
      <ConfirmDialog
        open={dialog === 'transfer'}
        title={fmt(s.transferConfirmTitle, {
          name: (() => {
            const m = candidates.find((c) => c.user_id === newOwner);
            return m ? m.display_name || m.email || '—' : '';
          })(),
        })}
        body={s.transferBody}
        confirmLabel={s.transfer}
        tone="primary"
        busy={action.busy}
        error={action.error}
        onClose={close}
        onConfirm={() => run(() => transferOwnership(ws.person.id, newOwner))}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        title={s.deleteTitle}
        body={s.deleteBody}
        confirmLabel={s.deleteButton}
        busy={action.busy || confirmName.trim() !== ws.person.preferred_name}
        error={action.error}
        onClose={close}
        onConfirm={() =>
          void action.run(async () => {
            await deletePerson(ws.person.id);
            window.location.assign(paths.account);
          })
        }
      >
        <Field
          label={fmt(s.deleteConfirm, { name: ws.person.preferred_name })}
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          autoComplete="off"
        />
      </ConfirmDialog>
    </div>
  );
}
