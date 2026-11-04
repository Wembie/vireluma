import { describe, expect, it } from 'vitest';

import { changelogSection } from './version-lib.mjs';

describe('changelogSection', () => {
  const changelog = '# Changelog\n\n## [1.2.0] - 2026-12-01\n\n- new\n\n## [1.1.0]\n\n- old\n';

  it('extracts a dated section', () => {
    expect(changelogSection(changelog, '1.2.0')).toEqual({ heading: '- 2026-12-01', body: '- new' });
  });

  it('extracts the last section', () => {
    expect(changelogSection(changelog, '1.1.0')?.body).toBe('- old');
  });

  it('treats regex metacharacters in the version literally', () => {
    expect(changelogSection(changelog, '1.2.0|1.1.0')).toBeNull();
    // A literal backslash must not turn into regex escapes.
    expect(changelogSection(changelog, String.raw`1\.2\.0`)).toBeNull();
    expect(changelogSection(changelog, '1.2.*')).toBeNull();
  });
});
