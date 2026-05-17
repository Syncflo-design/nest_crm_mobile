# NestERP CRM Mobile

Simplified rep-facing screen for customer view and quick Sales Order capture.

A custom Frappe v16 app, installable on any NestERP / ERPNext site. Designed
as a Skynamo-style daily-use tool for field sales reps: open a customer,
see their context, capture an order in seconds.

## Status

v0.1.0 - online-only demo build. Offline (service worker + IndexedDB sync
queue) is the Phase 2 work after the first client demo.

## Page route

`/desk/crm-mobile` (mobile-first, works on tablets and phones via the desk
shell).

## Roles with access

- Sales User
- Sales Manager
- System Manager

## See also

- `DEPLOY.md` for Frappe Cloud install + update procedure.
- `CLAUDE.md` for session notes, gotchas, and build history.
