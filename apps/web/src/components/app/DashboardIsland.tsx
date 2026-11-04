import { ChevronRight, Plus, QrCode, UserRound } from 'lucide-react';
import { setupProgress, type PersonSummary } from '@vireluma/domain';
import { formatDate, plural, fmt } from '../../i18n/format';
import { listPeople } from '../../lib/backend/data';
import { buttonClass } from '../ui/variants';
import { AppRoot, pendingInvite, type IslandProps } from './AppRoot';
import { Badge, ErrorView, Loading, personHref, useApp, useResource, useSession } from './kit';

export default function DashboardIsland(props: IslandProps) {
  return (
    <AppRoot {...props}>
      <Dashboard />
    </AppRoot>
  );
}

function Dashboard() {
  const { t, paths } = useApp();
  const session = useSession();
  const people = useResource(session.user ? listPeople : null, [session.user?.id]);
  const invite = session.user ? pendingInvite.get() : null;

  if (session.loading || !session.user) return <Loading label={t.loading} />;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="text-h2">{t.dashboard.title}</h1>
          <p className="text-lg text-fg-muted">{t.dashboard.lead}</p>
          <p className="text-sm text-fg-muted">
            {t.dashboard.signedInAs}{' '}
            <span className="font-semibold break-all text-fg" data-testid="account-email">
              {session.user.email}
            </span>
          </p>
        </div>
        <a href={paths.new} className={buttonClass('primary', 'md')}>
          <Plus className="size-5" aria-hidden="true" />
          {t.dashboard.add}
        </a>
      </div>

      {invite && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-current/15 bg-info-soft p-4 text-info">
          <p className="font-medium">{t.dashboard.pendingInvite}</p>
          <a href={paths.invite} className={buttonClass('outline', 'sm')}>
            {t.dashboard.pendingInviteAction}
          </a>
        </div>
      )}

      {people.loading && !people.data ? (
        <Loading label={t.loading} />
      ) : people.error ? (
        <ErrorView code={people.error} onRetry={() => void people.reload()} />
      ) : people.data && people.data.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2" aria-label={t.dashboard.title}>
          {people.data.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </ul>
      ) : (
        <div className="grid justify-items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface p-8">
          <UserRound className="size-10 text-primary" aria-hidden="true" />
          <h2 className="text-h4">{t.dashboard.emptyTitle}</h2>
          <p className="max-w-prose text-fg-muted">{t.dashboard.emptyBody}</p>
          <a href={paths.new} className={buttonClass('primary', 'md', 'mt-2')}>
            <Plus className="size-5" aria-hidden="true" />
            {t.dashboard.add}
          </a>
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }: { person: PersonSummary }) {
  const { t, locale, paths } = useApp();
  const progress = setupProgress(person);
  const suspended = person.status === 'suspended';

  return (
    <li className="relative grid gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition-shadow focus-within:ring-[3px] focus-within:ring-focus/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-h4 break-words">
          {/* The whole card is clickable through this link's ::after overlay. */}
          <a
            href={personHref(paths, 'person', person.id)}
            className="text-fg no-underline after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
          >
            {person.preferred_name}
          </a>
        </h2>
        <ChevronRight className="mt-1 size-5 shrink-0 text-fg-muted" aria-hidden="true" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone="primary">{t.roles[person.role]}</Badge>
        {suspended ? (
          <Badge tone="warning">{t.personStatus.suspended}</Badge>
        ) : progress.complete ? (
          <Badge tone="success">{t.dashboard.ready}</Badge>
        ) : (
          <Badge tone="warning">{t.dashboard.setupPending}</Badge>
        )}
        {person.is_minor && <Badge>{t.dashboard.minor}</Badge>}
      </div>
      <dl className="grid gap-1 text-sm text-fg-muted">
        <div className="flex items-center gap-2">
          <QrCode className="size-4" aria-hidden="true" />
          <dt className="sr-only">{t.person.identifier.title}</dt>
          <dd>{person.active_public_id ? t.dashboard.codeActive : t.dashboard.noCode}</dd>
        </div>
        <div>
          <dt className="sr-only">{t.person.contacts.title}</dt>
          <dd>{plural(t.dashboard.contacts, person.contacts_count, locale)}</dd>
        </div>
        {person.last_scan_at && (
          <div>
            <dt className="sr-only">{t.person.scans.title}</dt>
            <dd>{fmt(t.dashboard.lastScan, { date: formatDate(person.last_scan_at, locale, true) })}</dd>
          </div>
        )}
      </dl>
    </li>
  );
}
