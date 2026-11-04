# ADR-0010 — Apple AirTag / Find My and third-party trackers

- Status: Accepted · 2026-11-04
- Facts below reflect Apple's public documentation as understood at this date. Re-verify against
  current Apple documentation before publishing any product claim.

## Context

Families ask whether VIRELUMA "works with AirTag". A web application cannot access Apple's Find
My network, an AirTag's location, or program its behaviour. Reverse-engineering Apple's private
protocols is out of scope (legal, ethical and reliability reasons).

## Options

**A. AirTag as an independent complement (supported, documentation only).**
AirTag location is visible only to its owner (and people the owner shares it with) in Apple's Find
My app. In Lost Mode, anyone tapping it with an NFC-capable phone opens an Apple page showing the
serial number and the message/phone number the owner set. Scanning an AirTag does **not** open a
VIRELUMA profile. Apple positions AirTag for items, not people, and its anti-stalking
protections (unwanted-tracking alerts, sounds) may trigger when worn by someone else. iOS supports
sharing an item's location with a temporary link (_Share Item Location_); families could share
such a link with responders, entirely outside VIRELUMA. → We explain this honestly on the QR & NFC
page and never imply integration.

**B. Find My network accessory (MFi) — separate hardware initiative.**
Requires enrollment in Apple's MFi Program, compliance with the Find My Network Accessory
Specification, certified hardware/firmware and Apple certification of each product. This is a
commercial hardware partnership with its own budget and timeline, not a software feature.
→ Not planned before a validated hardware business case.

**C. Third-party BLE/GPS trackers with documented APIs.**
Evaluate only vendors offering official, documented APIs and data-processing agreements. Criteria:
battery life, location accuracy, background permissions, subscription cost, country availability,
privacy posture, data residency, and whether location can be gated behind explicit, revocable
consent. → Research spike in M4; no integration without a signed vendor agreement.

**D. Opt-in smartphone location sharing (the person's own phone).**
Explicit opt-in, visible indicator, time-boxed sessions, revocable at any time, never background
tracking without transparent authorization, never shown on the public emergency page by default.
→ Candidate for after M3, after privacy and legal review (sensitive data, minors).

## Decision

Ship A now (honest documentation). Keep B as a business decision. Research C in M4. Design D only
after the consent model is implemented and legally reviewed.
