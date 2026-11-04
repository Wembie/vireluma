import { describe, expect, it } from 'vitest';
import { parseEmailLinkDestination, validateEmail, validatePassword } from './auth.ts';

describe('validatePassword', () => {
  it('requires 12 to 72 characters', () => {
    expect(validatePassword('short')).toBe('weak_password');
    expect(validatePassword('a'.repeat(11))).toBe('weak_password');
    expect(validatePassword('a'.repeat(12))).toBeNull();
    expect(validatePassword('correct horse battery staple')).toBeNull();
    expect(validatePassword('a'.repeat(73))).toBe('weak_password');
  });
});

describe('validateEmail', () => {
  it.each(['ana@example.com', ' maria.gomez+care@correo.com.co ', 'a@b.co'])('accepts %j', (email) => {
    expect(validateEmail(email)).toBeNull();
  });
  it.each([
    '',
    'ana',
    '@example.com',
    'ana@',
    'ana@example',
    'ana@@example.com',
    'a b@example.com',
    'ana@.com',
    'ana@com.',
  ])('rejects %j', (email) => {
    expect(validateEmail(email)).toBe('invalid_email');
  });
  it('rejects over-long input quickly', () => {
    expect(validateEmail(`${'a'.repeat(300)}@example.com`)).toBe('invalid_email');
  });
});

describe('parseEmailLinkDestination', () => {
  it('allows only known destinations', () => {
    expect(parseEmailLinkDestination('reset-password')).toBe('reset-password');
    expect(parseEmailLinkDestination('account')).toBe('account');
    expect(parseEmailLinkDestination('https://evil.example')).toBe('account');
    expect(parseEmailLinkDestination('//evil.example')).toBe('account');
    expect(parseEmailLinkDestination(null)).toBe('account');
  });
});
