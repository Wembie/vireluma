import { describe, expect, it } from 'vitest';
import { mapsLink, parseEmergencyResolution } from './emergency.ts';

const active = {
  status: 'active',
  person: {
    preferred_name: 'Elena',
    emergency_message: 'Please stay with me',
    preferred_locale: 'es',
    country_code: 'CO',
    is_minor: false,
  },
  contacts: [
    { name: 'María', relationship: 'Daughter', phone: '+573001234567' },
    { name: 'Broken', relationship: null, phone: '3001234567' },
  ],
  details: [
    { kind: 'communication', title: 'Speak slowly', details: null },
    { kind: 'unknown', title: 'Dropped', details: null },
  ],
  emergency_numbers: [
    { service: 'general', number: '123' },
    { service: 'general', number: '123 or more' },
  ],
};

describe('parseEmergencyResolution', () => {
  it('parses an active profile and drops malformed entries', () => {
    const result = parseEmergencyResolution(active);
    expect(result.status).toBe('active');
    if (result.status !== 'active') return;
    expect(result.profile.preferredName).toBe('Elena');
    expect(result.profile.contacts).toEqual([
      { name: 'María', relationship: 'Daughter', phone: '+573001234567' },
    ]);
    expect(result.profile.details).toHaveLength(1);
    expect(result.profile.emergencyNumbers).toEqual([{ service: 'general', number: '123' }]);
    expect(result.profile.isMinor).toBe(false);
  });

  it('passes known non-active statuses through', () => {
    for (const status of ['invalid', 'not_found', 'revoked', 'suspended', 'rate_limited']) {
      expect(parseEmergencyResolution({ status })).toEqual({ status });
    }
  });

  it('degrades unknown shapes to malformed', () => {
    expect(parseEmergencyResolution(null)).toEqual({ status: 'malformed' });
    expect(parseEmergencyResolution([])).toEqual({ status: 'malformed' });
    expect(parseEmergencyResolution({ status: 'hacked' })).toEqual({ status: 'malformed' });
    expect(parseEmergencyResolution({ status: 'active', person: {} })).toEqual({ status: 'malformed' });
  });

  it('caps lengths and list sizes', () => {
    const result = parseEmergencyResolution({
      ...active,
      person: { ...active.person, preferred_name: 'x'.repeat(500), preferred_locale: 'de' },
      contacts: Array.from({ length: 50 }, (_, i) => ({ name: `C${i}`, phone: '+573001234567' })),
    });
    if (result.status !== 'active') throw new Error('expected active');
    expect(result.profile.preferredName).toHaveLength(60);
    expect(result.profile.preferredLocale).toBeNull();
    expect(result.profile.contacts).toHaveLength(10);
  });
});

describe('mapsLink', () => {
  it('rounds coordinates to about one metre', () => {
    expect(mapsLink(4.6097123456, -74.0817654321)).toBe(
      'https://www.google.com/maps/search/?api=1&query=4.60971,-74.08177',
    );
  });
});
