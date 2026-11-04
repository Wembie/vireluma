import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { can, isUuid, type PersonWorkspace } from '@vireluma/domain';
import { fmt } from '../../i18n/format';
import { getWorkspace } from '../../lib/backend/data';
import { AppRoot, type IslandProps } from './AppRoot';
import { Badge, ErrorView, Loading, useApp, useResource, useSession } from './kit';
import { ActivityTab } from './person/ActivityTab';
import { ContactsTab } from './person/ContactsTab';
import { DetailsTab } from './person/DetailsTab';
import { OverviewTab } from './person/OverviewTab';
import { ProfileTab } from './person/ProfileTab';
import { SettingsTab } from './person/SettingsTab';
import { SharingTab } from './person/SharingTab';

export default function PersonIsland(props: IslandProps) {
  return (
    <AppRoot {...props}>
      <PersonPage />
    </AppRoot>
  );
}

const TABS = ['overview', 'profile', 'contacts', 'details', 'sharing', 'activity', 'settings'] as const;
export type PersonTab = (typeof TABS)[number];

/** What each section needs; the database enforces the same rules. */
function visibleTabs(ws: PersonWorkspace): PersonTab[] {
  const role = ws.my_role;
  return TABS.filter((tab) => {
    if (tab === 'profile') return can(role, 'editProfile');
    if (tab === 'activity') return can(role, 'viewScans');
    if (tab === 'settings') return can(role, 'manageConsent');
    return true;
  });
}

export interface TabProps {
  ws: PersonWorkspace;
  reload: () => Promise<void>;
  go: (tab: PersonTab) => void;
}

function readLocation(): { id: string | null; tab: string | null } {
  if (typeof window === 'undefined') return { id: null, tab: null }; // static render
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return { id: isUuid(id) ? id : null, tab: params.get('tab') };
}

function PersonPage() {
  const { t, paths } = useApp();
  const session = useSession();
  const [{ id, tab: initialTab }] = useState(readLocation);
  const ws = useResource(session.user && id ? () => getWorkspace(id) : null, [session.user?.id, id]);
  const [tab, setTab] = useState<PersonTab>(
    (TABS as readonly string[]).includes(initialTab ?? '') ? (initialTab as PersonTab) : 'overview',
  );

  const tabs = useMemo(() => (ws.data ? visibleTabs(ws.data) : []), [ws.data]);
  const active = tabs.includes(tab) ? tab : 'overview';

  const go = (next: PersonTab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', next);
    window.history.replaceState(null, '', url);
  };

  // Session first: the static render and the first client render must match.
  if (session.loading) return <Loading label={t.loading} />;
  if (!id) return <ErrorView code="forbidden" />;
  if (ws.loading && !ws.data) return <Loading label={t.loading} />;
  if (ws.error && !ws.data) {
    return (
      <div className="grid gap-4">
        <ErrorView code={ws.error} onRetry={() => void ws.reload()} />
        <a href={paths.account}>{t.person.back}</a>
      </div>
    );
  }
  if (!ws.data) return null;

  const data = ws.data;
  const props: TabProps = { ws: data, reload: ws.reload, go };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid gap-3">
        <a href={paths.account} className="inline-flex items-center gap-1 text-sm font-semibold">
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t.person.back}
        </a>
        <h1 className="text-h2 break-words">{data.person.preferred_name}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{fmt(t.person.yourRole, { role: t.roles[data.my_role] })}</Badge>
          <Badge tone={data.person.status === 'active' ? 'success' : 'warning'}>
            {t.personStatus[data.person.status]}
          </Badge>
        </div>
      </div>
      <TabList tabs={tabs} active={active} onSelect={go} />
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={-1}
        className="focus:outline-none"
      >
        {active === 'overview' && <OverviewTab {...props} />}
        {active === 'profile' && <ProfileTab {...props} />}
        {active === 'contacts' && <ContactsTab {...props} />}
        {active === 'details' && <DetailsTab {...props} />}
        {active === 'sharing' && <SharingTab {...props} />}
        {active === 'activity' && <ActivityTab {...props} />}
        {active === 'settings' && <SettingsTab {...props} />}
      </div>
    </div>
  );
}

/** WAI-ARIA tabs (automatic activation, roving tabindex); selection is mirrored in the URL. */
function TabList({
  tabs,
  active,
  onSelect,
}: {
  tabs: PersonTab[];
  active: PersonTab;
  onSelect: (tab: PersonTab) => void;
}) {
  const { t } = useApp();
  const refs = useRef<Partial<Record<PersonTab, HTMLButtonElement | null>>>({});
  const [focusTarget, setFocusTarget] = useState<PersonTab | null>(null);

  useEffect(() => {
    if (focusTarget) refs.current[focusTarget]?.focus();
  }, [focusTarget]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    if (!next) return;
    onSelect(next);
    setFocusTarget(next);
  };

  return (
    <div
      role="tablist"
      aria-label={t.person.tabsLabel}
      className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
    >
      {tabs.map((tab, i) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            ref={(el) => {
              refs.current[tab] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab}`}
            aria-selected={selected}
            aria-controls={`panel-${tab}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(tab)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`min-h-[var(--vl-touch-min)] shrink-0 border-b-2 px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              selected ? 'border-primary text-fg' : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            {t.person.tabs[tab]}
          </button>
        );
      })}
    </div>
  );
}
