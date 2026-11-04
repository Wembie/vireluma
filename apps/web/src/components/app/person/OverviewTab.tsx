import { useState } from 'react';
import { CheckCircle2, Circle, ExternalLink, QrCode } from 'lucide-react';
import { can, formatPublicIdForPrint, parsePublicId, setupProgress, SETUP_STEPS } from '@vireluma/domain';
import { fmt, formatDate, plural } from '../../../i18n/format';
import { urls } from '../../../config/site';
import { issueIdentifier, revokeIdentifier } from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, ConfirmDialog, Panel, personHref, useAction, useApp } from '../kit';
import type { PersonTab, TabProps } from '../PersonIsland';

const STEP_TAB: Record<(typeof SETUP_STEPS)[number], PersonTab> = {
  profile: 'profile',
  contacts: 'contacts',
  details: 'details',
  identifier: 'overview',
};

export function OverviewTab({ ws, reload, go }: TabProps) {
  const { t, locale } = useApp();
  const progress = setupProgress({
    public_contacts_count: ws.contacts.filter((c) => c.visibility === 'public_emergency').length,
    details_count: ws.details.length,
    active_public_id: ws.identifier?.public_id ?? null,
  });
  const canEdit = can(ws.my_role, 'editProfile');

  return (
    <div className="grid gap-6">
      {canEdit && progress.next !== null && (
        <Panel title={t.person.setup.title}>
          <ol className="grid gap-3">
            {SETUP_STEPS.map((step) => {
              const done = progress.done[step];
              return (
                <li key={step} className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
                    ) : (
                      <Circle className="size-6 text-fg-muted" aria-hidden="true" />
                    )}
                    <span className={done ? 'text-fg-muted' : 'font-semibold text-fg'}>
                      {t.person.setup.steps[step]}
                      <span className="sr-only">
                        {' — '}
                        {done ? t.person.setup.done : t.person.setup.pending}
                      </span>
                    </span>
                  </span>
                  {!done && step !== 'identifier' && (
                    <button
                      type="button"
                      className={buttonClass('outline', 'sm')}
                      onClick={() => go(STEP_TAB[step])}
                    >
                      {t.person.setup.go}
                      <span className="sr-only">: {t.person.setup.steps[step]}</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </Panel>
      )}
      {progress.complete && canEdit && (
        <p className="rounded-md border border-current/15 bg-success-soft p-4 font-medium text-success">
          {t.person.setup.complete}
        </p>
      )}

      <IdentifierPanel ws={ws} reload={reload} />

      {ws.scans && (
        <Panel title={t.person.scans.title}>
          <p className="text-fg">{plural(t.person.scans.last30, ws.scans.last_30_days, locale)}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {ws.scans.last_scan_at
              ? fmt(t.person.scans.last, { date: formatDate(ws.scans.last_scan_at, locale, true) })
              : t.person.scans.none}
          </p>
        </Panel>
      )}
    </div>
  );
}

function IdentifierPanel({ ws, reload }: Pick<TabProps, 'ws' | 'reload'>) {
  const { t, locale, paths } = useApp();
  const action = useAction();
  const [confirm, setConfirm] = useState<'replace' | 'revoke' | null>(null);
  const canManage = can(ws.my_role, 'manageIdentifiers');
  const suspended = ws.person.status !== 'active';
  const id = ws.identifier ? parsePublicId(ws.identifier.public_id) : null;

  const issue = () =>
    void action.run(async () => {
      await issueIdentifier(ws.person.id);
      setConfirm(null);
      await reload();
    });
  const revoke = () =>
    void action.run(async () => {
      if (ws.identifier) await revokeIdentifier(ws.identifier.id, 'revoked_by_member');
      setConfirm(null);
      await reload();
    });

  return (
    <Panel title={t.person.identifier.title}>
      {!confirm && <ActionError code={action.error} />}
      {id && ws.identifier ? (
        <div className="grid gap-4">
          <p className="text-fg-muted">
            {fmt(t.person.identifier.issuedAt, { date: formatDate(ws.identifier.issued_at, locale) })}
          </p>
          <div>
            <p className="text-sm font-semibold text-fg">{t.person.identifier.manual}</p>
            <p className="font-mono text-lg tracking-wider text-fg" data-testid="public-id">
              {formatPublicIdForPrint(id)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={personHref(paths, 'qr', ws.person.id)} className={buttonClass('primary', 'md')}>
              <QrCode className="size-5" aria-hidden="true" />
              {t.person.identifier.studio}
            </a>
            <a
              href={urls.profileUrl(id)}
              target="_blank"
              rel="noopener"
              className={buttonClass('outline', 'md')}
            >
              {t.person.identifier.preview}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-3 border-t border-border pt-4">
              <button
                type="button"
                className={buttonClass('ghost', 'sm')}
                onClick={() => setConfirm('replace')}
              >
                {t.person.identifier.replace}
              </button>
              <button
                type="button"
                className={buttonClass('ghost', 'sm')}
                onClick={() => setConfirm('revoke')}
              >
                {t.person.identifier.revoke}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid justify-items-start gap-3">
          <p className="text-fg">{t.person.identifier.none}</p>
          {canManage &&
            (suspended ? (
              <p className="text-fg-muted">{t.person.identifier.suspended}</p>
            ) : (
              <button
                type="button"
                className={buttonClass('primary', 'md')}
                onClick={issue}
                disabled={action.busy}
                aria-busy={action.busy}
              >
                <QrCode className="size-5" aria-hidden="true" />
                {t.person.identifier.issue}
              </button>
            ))}
        </div>
      )}
      {ws.revoked_identifiers.length > 0 && (
        <p className="mt-4 text-sm text-fg-muted">
          {plural(t.person.identifier.history, ws.revoked_identifiers.length, locale)}
        </p>
      )}
      <ConfirmDialog
        open={confirm === 'replace'}
        title={t.person.identifier.replaceTitle}
        body={t.person.identifier.replaceBody}
        confirmLabel={t.person.identifier.replace}
        busy={action.busy}
        error={action.error}
        onConfirm={issue}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'revoke'}
        title={t.person.identifier.revokeTitle}
        body={t.person.identifier.revokeBody}
        confirmLabel={t.person.identifier.revoke}
        busy={action.busy}
        error={action.error}
        onConfirm={revoke}
        onClose={() => setConfirm(null)}
      />
    </Panel>
  );
}
