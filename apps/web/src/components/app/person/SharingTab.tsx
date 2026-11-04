import { useState, type FormEvent } from 'react';
import { Copy, Share2, UserPlus } from 'lucide-react';
import {
  assignableRoles,
  can,
  canRemoveMember,
  validateEmail,
  type Member,
  type MemberRole,
} from '@vireluma/domain';
import { fmt, formatDate } from '../../../i18n/format';
import {
  createInvitation,
  removeMember,
  revokeInvitation,
  updateMemberRole,
} from '../../../lib/backend/data';
import { buttonClass } from '../../ui/variants';
import { ActionError, Badge, ConfirmDialog, Modal, Panel, Select, useAction, useApp } from '../kit';
import { Field, SubmitButton } from '../ui';
import type { TabProps } from '../PersonIsland';

const memberName = (m: Member, you: string) => (m.is_me ? you : m.display_name || m.email || '—');

export function SharingTab({ ws, reload }: TabProps) {
  const { t, locale, paths } = useApp();
  const myRole = ws.my_role;
  const roles = assignableRoles(myRole);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const action = useAction();
  const remove = useAction();

  const changeRole = (member: Member, role: MemberRole) =>
    void action.run(async () => {
      await updateMemberRole(ws.person.id, member.user_id, role);
      await reload();
    });

  const leaving = removing?.is_me ?? false;

  return (
    <div className="grid gap-6">
      <Panel
        title={t.person.sharing.title}
        lead={t.person.sharing.lead}
        actions={
          can(myRole, 'inviteMembers') && (
            <button type="button" className={buttonClass('primary', 'md')} onClick={() => setInviting(true)}>
              <UserPlus className="size-5" aria-hidden="true" />
              {t.person.sharing.invite}
            </button>
          )
        }
      >
        <ActionError code={action.error} />
        <ul className="grid gap-3">
          {ws.members.map((m) => {
            const name = memberName(m, t.common.you);
            const editableRole =
              !m.is_me && m.role !== 'owner' && can(myRole, 'manageMembers') && roles.includes(m.role);
            return (
              <li
                key={m.user_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="font-semibold break-words text-fg">{name}</p>
                  {m.email && !m.is_me && <p className="text-sm break-all text-fg-muted">{m.email}</p>}
                  <p className="text-sm text-fg-muted">{t.roleHelp[m.role]}</p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  {editableRole ? (
                    <div className="w-56">
                      <Select
                        label={fmt(t.person.sharing.role, { name })}
                        value={m.role}
                        disabled={action.busy}
                        onChange={(e) => changeRole(m, e.target.value as MemberRole)}
                        options={roles.map((r) => ({ value: r, label: t.roles[r] }))}
                      />
                    </div>
                  ) : (
                    <Badge tone="primary">{t.roles[m.role]}</Badge>
                  )}
                  {!m.is_me && canRemoveMember(myRole, m.role) && (
                    <button
                      type="button"
                      className={buttonClass('ghost', 'sm')}
                      onClick={() => setRemoving(m)}
                      aria-label={fmt(t.person.sharing.removeLabel, { name })}
                    >
                      {t.person.sharing.remove}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {myRole !== 'owner' && (
          <div className="mt-5 border-t border-border pt-5">
            <button
              type="button"
              className={buttonClass('outline', 'sm')}
              onClick={() => setRemoving(ws.members.find((m) => m.is_me) ?? null)}
            >
              {t.person.sharing.leave}
            </button>
          </div>
        )}
      </Panel>

      {ws.invitations && ws.invitations.length > 0 && (
        <Panel title={t.person.sharing.pending} headingLevel={2}>
          <ul className="grid gap-3">
            {ws.invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-4"
              >
                <div className="grid min-w-0 gap-1">
                  <p className="font-semibold break-all text-fg">{inv.email}</p>
                  <p className="text-sm text-fg-muted">
                    {t.roles[inv.role]} ·{' '}
                    {fmt(t.person.sharing.expires, { date: formatDate(inv.expires_at, locale) })}
                  </p>
                </div>
                <button
                  type="button"
                  className={buttonClass('ghost', 'sm')}
                  aria-label={fmt(t.person.sharing.revokeInviteLabel, { email: inv.email })}
                  onClick={() =>
                    void action.run(async () => {
                      await revokeInvitation(inv.id);
                      await reload();
                    })
                  }
                >
                  {t.person.sharing.revokeInvite}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Modal open={inviting} title={t.person.sharing.inviteTitle} onClose={() => setInviting(false)}>
        {inviting && (
          <InviteForm
            personId={ws.person.id}
            personName={ws.person.preferred_name}
            roles={roles}
            invitePath={paths.invite}
            onClose={() => {
              setInviting(false);
              void reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={removing !== null}
        title={
          leaving
            ? t.person.sharing.leaveTitle
            : fmt(t.person.sharing.removeTitle, { name: removing ? memberName(removing, t.common.you) : '' })
        }
        body={leaving ? t.person.sharing.leaveBody : t.person.sharing.removeBody}
        confirmLabel={leaving ? t.person.sharing.leave : t.person.sharing.remove}
        busy={remove.busy}
        error={remove.error}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          void remove.run(async () => {
            if (!removing) return;
            await removeMember(ws.person.id, removing.user_id);
            if (leaving) {
              window.location.assign(paths.account);
              return;
            }
            setRemoving(null);
            await reload();
          })
        }
      />
    </div>
  );
}

function InviteForm({
  personId,
  personName,
  roles,
  invitePath,
  onClose,
}: {
  personId: string;
  personName: string;
  roles: MemberRole[];
  invitePath: string;
  onClose: () => void;
}) {
  const { t } = useApp();
  const action = useAction();
  const [emailError, setEmailError] = useState(false);
  const [link, setLink] = useState<{ email: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const role = String(data.get('role')) as MemberRole;
    const invalid = validateEmail(email) !== null;
    setEmailError(invalid);
    if (invalid) return;
    void action.run(async () => {
      const token = await createInvitation(personId, email, role);
      // The token travels in the fragment: never sent to the static host or in Referer.
      setLink({ email, url: `${window.location.origin}${invitePath}#${token}` });
    });
  };

  if (link) {
    const text = fmt(t.person.sharing.shareText, { name: personName });
    const canShare = typeof navigator.share === 'function';
    return (
      <div className="grid gap-4">
        <p className="font-semibold text-fg">{fmt(t.person.sharing.linkReady, { email: link.email })}</p>
        <p className="rounded-md bg-warning-soft p-3 text-sm text-fg">{t.person.sharing.linkWarning}</p>
        <input
          readOnly
          value={link.url}
          aria-label={fmt(t.person.sharing.linkReady, { email: link.email })}
          className="w-full rounded-md border border-border-strong bg-bg-subtle px-3 py-2 font-mono text-sm text-fg"
          onFocus={(e) => e.currentTarget.select()}
          data-testid="invite-link"
        />
        <div aria-live="polite">{copied && <p className="text-sm text-success">{t.common.copied}</p>}</div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={buttonClass('primary', 'md')}
            onClick={() =>
              void navigator.clipboard.writeText(link.url).then(
                () => setCopied(true),
                () => setCopied(false),
              )
            }
          >
            <Copy className="size-5" aria-hidden="true" />
            {t.common.copy}
          </button>
          {canShare && (
            <button
              type="button"
              className={buttonClass('outline', 'md')}
              onClick={() => void navigator.share({ text, url: link.url }).catch(() => undefined)}
            >
              <Share2 className="size-5" aria-hidden="true" />
              {t.person.sharing.share}
            </button>
          )}
          <button type="button" className={buttonClass('ghost', 'md')} onClick={onClose}>
            {t.common.close}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      <p className="text-fg-muted">{t.person.sharing.inviteBody}</p>
      <ActionError code={action.error} />
      <Field
        label={t.form.inviteEmail}
        name="email"
        type="email"
        autoComplete="off"
        required
        error={emailError ? t.errors.invalid_email : null}
      />
      <Select
        label={t.form.inviteRole}
        name="role"
        defaultValue={roles.includes('caregiver') ? 'caregiver' : roles[0]}
        options={roles.map((r) => ({ value: r, label: `${t.roles[r]} — ${t.roleHelp[r]}` }))}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className={buttonClass('outline', 'md')} onClick={onClose}>
          {t.common.cancel}
        </button>
        <div>
          <SubmitButton busy={action.busy}>{t.person.sharing.createLink}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
