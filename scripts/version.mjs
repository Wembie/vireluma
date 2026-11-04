#!/usr/bin/env node
/**
 * VERSION is the single source of truth for the release version.
 *
 *   node scripts/version.mjs check            VERSION is valid SemVer and CHANGELOG has its section
 *   node scripts/version.mjs check --release  …and the tag does not exist and the section is dated
 *   node scripts/version.mjs notes            prints the CHANGELOG section for VERSION (release body)
 *   node scripts/version.mjs current          prints VERSION
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEMVER, changelogSection } from './version-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function readVersion() {
  return readFileSync(join(root, 'VERSION'), 'utf8').trim();
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function tagExists(tag) {
  try {
    execFileSync('git', ['rev-parse', '-q', '--verify', `refs/tags/${tag}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const [command = 'check', ...flags] = process.argv.slice(2);
const version = readVersion();
const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');

switch (command) {
  case 'current':
    console.log(version);
    break;
  case 'notes': {
    const section = changelogSection(changelog, version);
    if (!section) fail(`CHANGELOG.md has no section for ${version}`);
    console.log(section.body);
    break;
  }
  case 'check': {
    if (!SEMVER.test(version)) fail(`VERSION "${version}" is not valid SemVer`);
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    if (pkg.version !== undefined)
      fail('Root package.json must not declare a version; VERSION is authoritative');
    const section = changelogSection(changelog, version);
    if (!section) fail(`CHANGELOG.md has no "## [${version}]" section`);
    if (flags.includes('--release')) {
      if (!/^- \d{4}-\d{2}-\d{2}$/.test(section.heading))
        fail(`CHANGELOG section for ${version} must be dated: "## [${version}] - YYYY-MM-DD"`);
      if (tagExists(`v${version}`)) fail(`Tag v${version} already exists — bump VERSION first`);
      if (!section.body) fail(`CHANGELOG section for ${version} is empty`);
    }
    console.log(`✔ VERSION ${version} is consistent${flags.includes('--release') ? ' and releasable' : ''}`);
    break;
  }
  default:
    fail(`Unknown command "${command}"`);
}
