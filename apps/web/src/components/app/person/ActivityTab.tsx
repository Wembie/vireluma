import { useState } from 'react';
import type { ActivityPage } from '@vireluma/domain';
import { fmt, formatDate } from '../../../i18n/format';
import { getActivity } from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, ErrorView, Loading, Panel, useAction, useApp, useResource } from '../kit';
import type { TabProps } from '../PersonIsland';

const PAGE = 25;

type Audit = NonNullable<ActivityPage['audit']>;

/** Loaded only when opened; keyset pages ("before id") stay fast however long the history grows. */
export function ActivityTab({ ws }: TabProps) {
  const { t, locale } = useApp();
  const first = useResource(() => getActivity(ws.person.id, {}, PAGE), [ws.person.id]);
  const [more, setMore] = useState<{ audit: Audit; scans: ActivityPage['scans'] }>({ audit: [], scans: [] });
  const [exhausted, setExhausted] = useState({ audit: false, scans: false });
  const action = useAction();

  if (first.loading && !first.data) return <Loading label={t.loading} />;
  if (first.error || !first.data)
    return <ErrorView code={first.error ?? 'unknown'} onRetry={() => void first.reload()} />;

  const audit = first.data.audit === null ? null : [...first.data.audit, ...more.audit];
  const scans = [...first.data.scans, ...more.scans];
  const auditDone = exhausted.audit || (first.data.audit?.length ?? 0) < PAGE;
  const scansDone = exhausted.scans || first.data.scans.length < PAGE;

  const loadMore = (kind: 'audit' | 'scans') =>
    void action.run(async () => {
      const cursor =
        kind === 'audit'
          ? { beforeAudit: audit?.at(-1)?.id ?? undefined, beforeScan: 0 }
          : { beforeScan: scans.at(-1)?.id ?? undefined, beforeAudit: 0 };
      const page = await getActivity(ws.person.id, cursor, PAGE);
      const items = kind === 'audit' ? (page.audit ?? []) : page.scans;
      setMore((m) =>
        kind === 'audit'
          ? { ...m, audit: [...m.audit, ...(page.audit ?? [])] }
          : { ...m, scans: [...m.scans, ...page.scans] },
      );
      if (items.length < PAGE) setExhausted((e) => ({ ...e, [kind]: true }));
    });

  return (
    <div className="grid gap-6">
      <p className="text-sm text-fg-muted">{t.person.activity.privacy}</p>
      <ActionError code={action.error} />
      <Panel title={t.person.activity.scansTitle}>
        {scans.length === 0 ? (
          <p className="text-fg-muted">{t.person.activity.empty}</p>
        ) : (
          <ul className="grid divide-y divide-border">
            {scans.map((s) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2.5">
                <span className="text-fg">
                  {t.person.activity.outcomes[s.outcome as keyof typeof t.person.activity.outcomes] ??
                    s.outcome}
                </span>
                <time dateTime={s.at} className="text-sm text-fg-muted tabular-nums">
                  {formatDate(s.at, locale, true)}
                </time>
              </li>
            ))}
          </ul>
        )}
        {!scansDone && (
          <button
            type="button"
            className={buttonClass('outline', 'sm', 'mt-4')}
            onClick={() => loadMore('scans')}
            disabled={action.busy}
          >
            {t.common.loadMore}
          </button>
        )}
      </Panel>

      {audit && (
        <Panel title={t.person.activity.auditTitle}>
          {audit.length === 0 ? (
            <p className="text-fg-muted">{t.person.activity.empty}</p>
          ) : (
            <ul className="grid divide-y divide-border">
              {audit.map((a) => {
                const entity =
                  t.person.activity.entities[a.entity as keyof typeof t.person.activity.entities] ?? a.entity;
                const actor = a.by_me ? t.common.you : (a.actor_email ?? t.person.activity.formerMember);
                return (
                  <li key={a.id} className="grid gap-0.5 py-2.5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold text-fg">
                        {entity} · {t.person.activity.actions[a.action]}
                      </span>
                      <time dateTime={a.at} className="text-sm text-fg-muted tabular-nums">
                        {formatDate(a.at, locale, true)}
                      </time>
                    </div>
                    <span className="text-sm text-fg-muted">{fmt(t.person.activity.by, { actor })}</span>
                    {a.changed && a.changed.length > 0 && (
                      <span className="text-xs text-fg-muted">
                        {fmt(t.person.activity.changedFields, { fields: a.changed.join(', ') })}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!auditDone && (
            <button
              type="button"
              className={buttonClass('outline', 'sm', 'mt-4')}
              onClick={() => loadMore('audit')}
              disabled={action.busy}
            >
              {t.common.loadMore}
            </button>
          )}
        </Panel>
      )}
    </div>
  );
}
