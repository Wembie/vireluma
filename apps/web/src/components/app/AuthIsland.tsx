import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  parseEmailLinkDestination,
  validateEmail,
  validatePassword,
  type AuthErrorCode,
  type AuthPort,
  type AuthUser,
} from '@vireluma/domain';
import type { AppPage, Dictionary } from '../../i18n';
import { backendConfigured, createSupabaseAuth } from '../../lib/backend/supabase-auth';
import { buttonClass } from '../ui/variants';
import { Field, FormMessage, SubmitButton } from './ui';

type Strings = Dictionary['app'];
type InteractivePage = Exclude<AppPage, 'check-email'>;

interface Props {
  page: InteractivePage;
  locale: string;
  strings: Strings;
  /** Root-relative paths of every account page for this locale. */
  paths: Record<AppPage, string>;
}

const linkClass = 'font-semibold';

export default function AuthIsland({ page, locale, strings, paths }: Props) {
  const auth = useMemo<AuthPort>(
    () =>
      createSupabaseAuth(
        (next) => `${window.location.origin}${paths.callback}?next=${encodeURIComponent(next)}`,
      ),
    [paths.callback],
  );

  if (!backendConfigured) return <FormMessage tone="info">{strings.notConfigured}</FormMessage>;

  const shared = { auth, strings, paths };
  switch (page) {
    case 'login':
      return <Login {...shared} />;
    case 'register':
      return <Register {...shared} locale={locale} />;
    case 'forgot-password':
      return <Forgot {...shared} />;
    case 'reset-password':
      return <Reset {...shared} />;
    case 'callback':
      return <Callback {...shared} />;
    case 'account':
      return <Account {...shared} />;
  }
}

interface Shared {
  auth: AuthPort;
  strings: Strings;
  paths: Record<AppPage, string>;
}

function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<AuthErrorCode | null>(null);
  const run = async (task: () => Promise<AuthErrorCode | null>) => {
    setBusy(true);
    setError(null);
    try {
      setError(await task());
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

const formData = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  return (name: string) => String(data.get(name) ?? '');
};

function Login({ auth, strings, paths }: Shared) {
  const { busy, error, run } = useSubmit();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const get = formData(event);
    void run(async () => {
      const result = await auth.signIn(get('email'), get('password'));
      if (!result.ok) return result.error;
      window.location.assign(paths.account);
      return null;
    });
  };
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      {error && <FormMessage tone="danger">{strings.errors[error]}</FormMessage>}
      <Field label={strings.fields.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={strings.fields.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        showPasswordLabel={strings.fields.showPassword}
      />
      <SubmitButton busy={busy}>{strings.login.submit}</SubmitButton>
      <p className="text-sm">
        <a className={linkClass} href={paths['forgot-password']}>
          {strings.login.forgot}
        </a>
      </p>
      <p className="text-sm text-fg">
        {strings.login.noAccount}{' '}
        <a className={linkClass} href={paths.register}>
          {strings.login.register}
        </a>
      </p>
    </form>
  );
}

function Register({ auth, strings, paths, locale }: Shared & { locale: string }) {
  const { busy, error, setError, run } = useSubmit();
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const get = formData(event);
    const invalid = validateEmail(get('email')) ?? validatePassword(get('password'));
    if (invalid) {
      setError(invalid);
      return;
    }
    void run(async () => {
      const result = await auth.signUp(get('email'), get('password'), locale);
      if (!result.ok) return result.error;
      window.location.assign(paths['check-email']);
      return null;
    });
  };
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      {error && <FormMessage tone="danger">{strings.errors[error]}</FormMessage>}
      <Field label={strings.fields.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={strings.fields.password}
        hint={strings.fields.passwordHint}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={72}
        required
        showPasswordLabel={strings.fields.showPassword}
      />
      <p className="text-sm text-fg-muted">{strings.register.privacy}</p>
      <SubmitButton busy={busy}>{strings.register.submit}</SubmitButton>
      <p className="text-sm text-fg">
        {strings.register.haveAccount}{' '}
        <a className={linkClass} href={paths.login}>
          {strings.signIn}
        </a>
      </p>
    </form>
  );
}

function Forgot({ auth, strings }: Shared) {
  const { busy, error, setError, run } = useSubmit();
  const [sent, setSent] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const get = formData(event);
    const invalid = validateEmail(get('email'));
    if (invalid) {
      setError(invalid);
      return;
    }
    void run(async () => {
      const result = await auth.requestPasswordReset(get('email'));
      if (!result.ok) return result.error;
      setSent(true);
      return null;
    });
  };
  if (sent) return <FormMessage tone="success">{strings.forgot.sent}</FormMessage>;
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      {error && <FormMessage tone="danger">{strings.errors[error]}</FormMessage>}
      <Field label={strings.fields.email} name="email" type="email" autoComplete="email" required />
      <SubmitButton busy={busy}>{strings.forgot.submit}</SubmitButton>
    </form>
  );
}

function useCurrentUser(auth: AuthPort) {
  const [state, setState] = useState<{ loading: boolean; user: AuthUser | null }>({
    loading: true,
    user: null,
  });
  useEffect(() => {
    let active = true;
    void auth.currentUser().then((user) => active && setState({ loading: false, user }));
    return () => {
      active = false;
    };
  }, [auth]);
  return state;
}

function Reset({ auth, strings, paths }: Shared) {
  const { loading, user } = useCurrentUser(auth);
  const { busy, error, setError, run } = useSubmit();
  const [done, setDone] = useState(false);

  if (loading) return <p role="status">{strings.loading}</p>;
  if (!user) {
    return (
      <div className="grid gap-4">
        <FormMessage tone="danger">{strings.errors.link_invalid}</FormMessage>
        <a className={linkClass} href={paths['forgot-password']}>
          {strings.forgot.title}
        </a>
      </div>
    );
  }
  if (done) {
    return (
      <div className="grid gap-4">
        <FormMessage tone="success">{strings.reset.done}</FormMessage>
        <a className={buttonClass('primary', 'lg', 'w-full')} href={paths.account}>
          {strings.account.title}
        </a>
      </div>
    );
  }
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    const get = formData(event);
    const invalid = validatePassword(get('password'));
    if (invalid) {
      setError(invalid);
      return;
    }
    void run(async () => {
      const result = await auth.updatePassword(get('password'));
      if (!result.ok) return result.error;
      setDone(true);
      return null;
    });
  };
  return (
    <form className="grid gap-5" onSubmit={onSubmit} noValidate>
      {error && <FormMessage tone="danger">{strings.errors[error]}</FormMessage>}
      <Field
        label={strings.fields.newPassword}
        hint={strings.fields.passwordHint}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={72}
        required
        showPasswordLabel={strings.fields.showPassword}
      />
      <SubmitButton busy={busy}>{strings.reset.submit}</SubmitButton>
    </form>
  );
}

function Callback({ auth, strings, paths }: Shared) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const next = parseEmailLinkDestination(params.get('next'));
    // Remove the one-time code from the address bar and history right away.
    window.history.replaceState(null, '', window.location.pathname);
    if (!code) {
      setFailed(true);
      return;
    }
    void auth.completeEmailLink(code).then((result) => {
      if (result.ok) window.location.replace(paths[next]);
      else setFailed(true);
    });
  }, [auth, paths]);

  if (!failed) return <p role="status">{strings.callback.working}</p>;
  return (
    <div className="grid gap-4">
      <FormMessage tone="info">{strings.callback.failed}</FormMessage>
      <a className={buttonClass('primary', 'lg', 'w-full')} href={paths.login}>
        {strings.signIn}
      </a>
    </div>
  );
}

function Account({ auth, strings, paths }: Shared) {
  const { loading, user } = useCurrentUser(auth);
  const { busy, error, run } = useSubmit();
  const [confirming, setConfirming] = useState(false);
  const [deletionRequested, setDeletionRequested] = useState(false);

  useEffect(() => {
    if (!loading && !user) window.location.replace(paths.login);
  }, [loading, user, paths.login]);

  if (loading || !user) return <p role="status">{strings.loading}</p>;

  const signOut = (scope: 'local' | 'global') =>
    void run(async () => {
      const result = await auth.signOut(scope);
      if (!result.ok) return result.error;
      window.location.assign(paths.login);
      return null;
    });

  const requestDeletion = () =>
    void run(async () => {
      const result = await auth.requestAccountDeletion();
      if (!result.ok) return result.error;
      setConfirming(false);
      setDeletionRequested(true);
      return null;
    });

  return (
    <div className="grid gap-8">
      {error && <FormMessage tone="danger">{strings.errors[error]}</FormMessage>}
      <section className="grid gap-1">
        <p className="text-sm text-fg-muted">{strings.account.signedInAs}</p>
        <p className="text-lg font-semibold break-all text-fg" data-testid="account-email">
          {user.email}
        </p>
      </section>

      <section aria-labelledby="people-title" className="rounded-lg bg-bg-subtle p-5">
        <h2 id="people-title" className="text-h4">
          {strings.account.peopleTitle}
        </h2>
        <p className="mt-2 text-fg">{strings.account.peopleBody}</p>
      </section>

      <section className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className={buttonClass('secondary', 'md')}
          onClick={() => signOut('local')}
          disabled={busy}
        >
          {strings.account.signOut}
        </button>
        <button
          type="button"
          className={buttonClass('outline', 'md')}
          onClick={() => signOut('global')}
          disabled={busy}
        >
          {strings.account.signOutEverywhere}
        </button>
      </section>

      <section aria-labelledby="delete-title" className="grid gap-3 border-t border-border pt-6">
        <h2 id="delete-title" className="text-h4">
          {strings.account.deleteTitle}
        </h2>
        <p className="text-fg-muted">{strings.account.deleteBody}</p>
        {deletionRequested ? (
          <FormMessage tone="success">{strings.account.deleteRequested}</FormMessage>
        ) : confirming ? (
          <div
            className="grid gap-3 rounded-md border border-danger/40 bg-danger-soft p-4"
            role="group"
            aria-labelledby="delete-confirm"
          >
            <p id="delete-confirm" className="font-semibold text-fg">
              {strings.account.deleteConfirmTitle}
            </p>
            <p className="text-fg">{strings.account.deleteConfirmBody}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className={buttonClass('danger', 'md')}
                onClick={requestDeletion}
                disabled={busy}
              >
                {strings.account.deleteButton}
              </button>
              <button
                type="button"
                className={buttonClass('outline', 'md')}
                onClick={() => setConfirming(false)}
              >
                {strings.account.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className={buttonClass('outline', 'md')}
              onClick={() => setConfirming(true)}
            >
              {strings.account.deleteButton}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
