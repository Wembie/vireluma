import { useEffect, useState } from 'react';
import type { InvitationPreview } from '@vireluma/domain';
import { fmt } from '../../i18n/format';
import { acceptInvitation, getSessionEmail, previewInvitation } from '../../lib/backend/data';
import { buttonClass } from '../ui/variants';
import { AppRoot, pendingInvite, type IslandProps } from './AppRoot';
import { ActionError, Loading, personHref, useAction, useApp } from './kit';
import { FormMessage } from './ui';

export default function InviteIsland(props: IslandProps) {
  return (
    <AppRoot {...props}>
      <Invite />
    </AppRoot>
  );
}

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'signed_out' }
  | { kind: 'preview'; token: string; preview: InvitationPreview };

/**
 * The token arrives in the URL fragment (never sent to the host). It is moved
 * to local storage right away and removed from the address bar, so it
 * survives sign-in or registration but not a shared screenshot of the URL.
 */
function Invite() {
  const { t, paths } = useApp();
  const action = useAction();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const fromHash = window.location.hash.replace(/^#/, '');
    if (/^[0-9a-f]{64}$/.test(fromHash)) {
      pendingInvite.set(fromHash);
      window.history.replaceState(null, '', window.location.pathname);
    }
    const token = /^[0-9a-f]{64}$/.test(fromHash) ? fromHash : pendingInvite.get();
    if (!token) {
      setState({ kind: 'missing' });
      return;
    }
    void (async () => {
      const user = await getSessionEmail().catch(() => null);
      if (!user) {
        setState({ kind: 'signed_out' });
        return;
      }
      try {
        const preview = await previewInvitation(token);
        if (preview.status !== 'valid' && preview.status !== 'rate_limited') pendingInvite.clear();
        setState({ kind: 'preview', token, preview });
      } catch {
        setState({ kind: 'preview', token, preview: { status: 'invalid' } });
      }
    })();
  }, []);

  if (state.kind === 'loading') return <Loading label={t.invite.checking} />;
  if (state.kind === 'missing') return <FormMessage tone="info">{t.invite.statuses.missing}</FormMessage>;
  if (state.kind === 'signed_out') {
    return (
      <div className="grid gap-4">
        <p className="text-fg">{t.invite.signInFirst}</p>
        <a href={`${paths.login}?next=invite`} className={buttonClass('primary', 'lg', 'w-full')}>
          {t.signIn}
        </a>
        <a href={paths.register} className={buttonClass('outline', 'lg', 'w-full')}>
          {t.login.register}
        </a>
      </div>
    );
  }

  const { preview, token } = state;
  if (preview.status === 'already_member') {
    return (
      <div className="grid gap-4">
        <FormMessage tone="info">{t.invite.statuses.already_member}</FormMessage>
        <a
          href={personHref(paths, 'person', preview.person_id)}
          className={buttonClass('primary', 'lg', 'w-full')}
        >
          {t.invite.open}
        </a>
      </div>
    );
  }
  if (preview.status !== 'valid') {
    return (
      <div className="grid gap-4">
        <FormMessage tone="danger">{t.invite.statuses[preview.status]}</FormMessage>
        <a href={paths.account} className={buttonClass('outline', 'lg', 'w-full')}>
          {t.dashboard.title}
        </a>
      </div>
    );
  }

  const accept = () =>
    void action.run(async () => {
      const personId = await acceptInvitation(token);
      pendingInvite.clear();
      window.location.assign(personHref(paths, 'person', personId));
    });

  return (
    <div className="grid gap-5">
      <p className="text-lg text-fg">
        {fmt(t.invite.valid, {
          inviter: preview.invited_by ?? t.invite.someone,
          name: preview.preferred_name,
          role: t.roles[preview.role],
        })}
      </p>
      <p className="text-sm text-fg-muted">{t.roleHelp[preview.role]}</p>
      <ActionError code={action.error} />
      <button
        type="button"
        className={buttonClass('primary', 'lg', 'w-full')}
        onClick={accept}
        disabled={action.busy}
        aria-busy={action.busy}
      >
        {t.invite.accept}
      </button>
    </div>
  );
}
