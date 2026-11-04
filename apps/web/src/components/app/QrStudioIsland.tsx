import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Download, Printer, TriangleAlert } from 'lucide-react';
import {
  LOCALES,
  formatPublicIdForPrint,
  isLocale,
  isUuid,
  parsePublicId,
  type Locale,
} from '@vireluma/domain';
import { urls } from '../../config/site';
import type { Dictionary } from '../../i18n';
import { getWorkspace } from '../../lib/backend/data';
import {
  buildArtwork,
  checkReadable,
  download,
  mmToPx,
  svgToCanvas,
  type QrLayout,
  type ReadCheck,
} from '../../lib/qr-studio';
import { buttonClass } from '../ui/variants';
import { AppRoot, type IslandProps } from './AppRoot';
import { Check, ErrorView, Loading, Panel, Select, personHref, useApp, useResource, useSession } from './kit';
import { languageName } from './PersonFields';

type PrintStrings = Dictionary['print'];

export default function QrStudioIsland(props: IslandProps & { print: Record<Locale, PrintStrings> }) {
  const { print, ...rest } = props;
  return (
    <AppRoot {...rest}>
      <QrStudio print={print} />
    </AppRoot>
  );
}

const LAYOUTS: QrLayout[] = ['card', 'sticker', 'wristband', 'plain'];

function QrStudio({ print }: { print: Record<Locale, PrintStrings> }) {
  const { t, locale, paths } = useApp();
  const session = useSession();
  const [id] = useState(() => {
    if (typeof window === 'undefined') return null; // static render
    const value = new URLSearchParams(window.location.search).get('id');
    return isUuid(value) ? value : null;
  });
  const ws = useResource(session.user && id ? () => getWorkspace(id) : null, [session.user?.id, id]);

  const [layout, setLayout] = useState<QrLayout>('card');
  const [logo, setLogo] = useState(false);
  const [showName, setShowName] = useState(false);
  const [labelLocale, setLabelLocale] = useState<Locale | null>(null);
  const [check, setCheck] = useState<ReadCheck | 'checking'>('checking');

  const data = ws.data;
  const publicId = data?.identifier ? parsePublicId(data.identifier.public_id) : null;
  const lang: Locale =
    labelLocale ?? (data && isLocale(data.person.preferred_locale) ? data.person.preferred_locale : locale);
  const profileUrl = publicId ? urls.profileUrl(publicId) : null;

  const artwork = useMemo(() => {
    if (!publicId || !profileUrl || !data) return null;
    const options = {
      url: profileUrl,
      logo,
      ecc: 'M' as const,
      labels: print[lang],
      manualUrl: urls
        .absolute('p/')
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, ''),
      code: formatPublicIdForPrint(publicId),
      name: showName ? data.person.preferred_name : null,
    };
    return {
      print: buildArtwork({ ...options, layout }),
      // Readability is checked on the bare code at screen resolution.
      plain: buildArtwork({ ...options, layout: 'plain' }),
    };
  }, [publicId, profileUrl, data, logo, showName, lang, layout, print]);

  useEffect(() => {
    if (!artwork || !profileUrl) return;
    let active = true;
    setCheck('checking');
    void checkReadable(artwork.plain.svg, profileUrl).then((result) => active && setCheck(result));
    return () => {
      active = false;
    };
  }, [artwork, profileUrl]);

  if (session.loading) return <Loading label={t.loading} />;
  if (!id) return <ErrorView code="forbidden" />;
  if (ws.loading && !data) return <Loading label={t.loading} />;
  if (ws.error || !data) return <ErrorView code={ws.error ?? 'unknown'} onRetry={() => void ws.reload()} />;

  const back = (
    <a
      href={personHref(paths, 'person', data.person.id)}
      className="inline-flex items-center gap-1 text-sm font-semibold"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {data.person.preferred_name}
    </a>
  );

  if (!artwork || !publicId) {
    return (
      <div className="grid gap-4">
        {back}
        <h1 className="text-h2">{t.qr.title}</h1>
        <p className="text-fg">{t.qr.noIdentifier}</p>
      </div>
    );
  }

  const base = `vireluma-${publicId.slice(0, 6).toLowerCase()}-${layout}`;
  const downloadPng = async () => {
    const { widthMm, heightMm, svg } = artwork.print;
    const canvas = await svgToCanvas(svg, mmToPx(widthMm), mmToPx(heightMm));
    canvas.toBlob((blob) => blob && download(`${base}.png`, blob), 'image/png');
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid gap-2 print:hidden">
        {back}
        <h1 className="text-h2">{t.qr.title}</h1>
        <p className="text-lg text-fg-muted">{t.qr.lead}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <div className="grid content-start gap-5 print:hidden">
          <Panel title={t.qr.layout}>
            <div className="grid gap-5">
              <fieldset className="grid gap-2">
                <legend className="sr-only">{t.qr.layout}</legend>
                {LAYOUTS.map((l) => (
                  <label
                    key={l}
                    className="flex min-h-[var(--vl-touch-min)] cursor-pointer items-center gap-3 rounded-md border border-border px-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                  >
                    <input
                      type="radio"
                      name="layout"
                      value={l}
                      checked={layout === l}
                      onChange={() => setLayout(l)}
                      className="size-5 accent-[var(--vl-primary)]"
                    />
                    <span className="text-fg">{t.qr.layouts[l]}</span>
                  </label>
                ))}
              </fieldset>
              {layout !== 'plain' && (
                <Select
                  label={t.qr.labelLocale}
                  value={lang}
                  onChange={(e) => isLocale(e.target.value) && setLabelLocale(e.target.value)}
                  options={LOCALES.map((l) => ({ value: l, label: languageName(l, locale) }))}
                />
              )}
              {(layout === 'card' || layout === 'wristband') && (
                <Check
                  label={t.qr.showName}
                  hint={t.qr.showNameHint}
                  checked={showName}
                  onChange={setShowName}
                />
              )}
              <Check label={t.qr.logo} hint={t.qr.logoHint} checked={logo} onChange={setLogo} />
            </div>
          </Panel>

          <div aria-live="polite" data-testid="qr-check">
            {check === 'checking' && <p className="text-fg-muted">{t.qr.check.checking}</p>}
            {check === 'ok' && (
              <p className="flex gap-2 rounded-md bg-success-soft p-3 text-sm font-medium text-success">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                {t.qr.check.ok}
              </p>
            )}
            {(check === 'fail' || check === 'unsupported') && (
              <p className="flex gap-2 rounded-md bg-warning-soft p-3 text-sm font-medium text-fg">
                <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
                {t.qr.check[check]}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass('primary', 'md')}
              onClick={() => window.print()}
              disabled={check === 'fail'}
            >
              <Printer className="size-5" aria-hidden="true" />
              {t.qr.print}
            </button>
            <button
              type="button"
              className={buttonClass('outline', 'md')}
              disabled={check === 'fail'}
              onClick={() =>
                download(`${base}.svg`, new Blob([artwork.print.svg], { type: 'image/svg+xml' }))
              }
            >
              <Download className="size-5" aria-hidden="true" />
              {t.qr.downloadSvg}
            </button>
            <button
              type="button"
              className={buttonClass('outline', 'md')}
              disabled={check === 'fail'}
              onClick={() => void downloadPng()}
            >
              <Download className="size-5" aria-hidden="true" />
              {t.qr.downloadPng}
            </button>
          </div>
          <p className="text-sm text-fg-muted">{t.qr.tips}</p>
          <p className="text-sm break-all text-fg-muted">
            {t.qr.address}: <span className="font-mono text-fg">{profileUrl}</span>
          </p>
        </div>

        <figure className="grid content-start gap-2">
          <figcaption className="text-sm font-semibold text-fg-muted print:hidden">{t.qr.preview}</figcaption>
          {/* Generated locally from the identifier; contains no user-supplied markup except escaped text. */}
          <div
            id="qr-print-area"
            role="img"
            aria-label={`${t.qr.title} — ${t.qr.layouts[layout]}`}
            className="w-full max-w-xl rounded-lg bg-bg-subtle p-4 print:max-w-none print:bg-transparent print:p-0 [&>svg]:h-auto [&>svg]:w-full print:[&>svg]:w-auto"
            dangerouslySetInnerHTML={{ __html: artwork.print.svg }}
          />
        </figure>
      </div>
    </div>
  );
}
