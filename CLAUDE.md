# nest_crm_mobile - Claude session notes

> **STOP. READ THIS FIRST. DO NOT SKIP.**
>
> If you are an AI assistant working on this repo, the rules in this file
> apply identically to those in `../production_floor/CLAUDE.md`. This is a
> Frappe v16 custom app built on the same page-bundle pattern, with the same
> traps. **Read those rules first before touching `.js`, `.html`, or `.json`
> in `nest_crm_mobile/mobile_crm/page/crm_mobile/`.**
>
> Quick reminder of the five non-negotiables:
>
> 1. HTML for the page goes in `crm_mobile.js` as a string array joined with
>    `\n`. **Not** a backtick template literal.
> 2. `crm_mobile.html` is **not** dead code. Frappe auto-registers it as
>    `frappe.templates["crm_mobile"]` in single quotes - any apostrophe in
>    the file breaks the bundle. Keep it as
>    `<div id="crm-mobile-placeholder"></div>` only.
> 3. The controller must be `window.crmMobile = {...}`, not
>    `const crmMobile = {...}`. Page bundles run in function scope.
> 4. Deploy cycle: push -> Frappe Cloud Bench -> **Pull Updates**
>    (do NOT skip) -> Deploy -> incognito reload. Always bump the
>    `BUILD_MARKER` constant so deploys are verifiable.
> 5. When something works after a non-trivial debug, **append the lesson to
>    this file** before ending the session.

## Site & repo

- **Site**: `https://blomoplastics.jh.frappe.cloud/desk/crm-mobile`
  (and any future NestERP / ERPNext site we install on)
- **GitHub**: `https://github.com/Syncflo-design/nest_crm_mobile`
- **Local repo**: `C:\Users\User\production_floor\nest_crm_mobile`
- **App name**: `nest_crm_mobile`
- **App title**: `NestERP CRM Mobile`
- **Frappe module**: `Mobile CRM`
- **Page route**: `/desk/crm-mobile`

## What this app is

A rep-facing mobile-first screen for browsing customers and capturing Sales
Orders fast. Positioned as our answer to Skynamo's Field Sales App, but
unified into NestERP (no sync layer, the order lands directly as a Sales
Order in production planning).

## v0.1.0 - 2026-05-17 - initial demo build

Online-only, 4 views in one Frappe page:

1. **Customer list** - searchable, last-modified-first, top 100 customers
2. **Customer 360** - customer header (name, group, territory, phone,
   email, outstanding amount), recent 5 Sales Orders, big "Start Order"
   button
3. **Order capture** - customer header, searchable item list (top 100,
   `is_sales_item=1`), tap to add to cart, +/- qty steppers, running total,
   Submit button -> creates a `Sales Order` in draft (`docstatus=0`)
4. **My Orders** - last 30 SOs owned by the current user (placeholder for
   the offline drafts/sync queue work in Phase 2)

Bottom nav has two buttons: Customers, My Orders. Top bar shows a back
arrow when not on the root of each tab.

### Architecture decisions

- **Lives as a desk Page**, not a website route. Faster to ship for the
  demo and shares the proven floor-ops / wo-wip pattern. Trade-off: cannot
  install as a PWA, cannot work offline. The desk shell is required.
- **For full offline (Phase 2)**, we will need to rebuild as a Frappe
  Website route (`/rep` or similar) so we can register a service worker
  outside the desk shell. The existing page logic ports cleanly - it is
  all `frappe.call` invocations against `frappe.client.*` methods, which
  also work from a website context.
- **Pricing uses `Item.standard_rate`** with no Pricing Rule / Customer
  Pricelist resolution. Deferred to production; client will confirm
  pricing strategy first.
- **No stock badge** in v0.1. Adding `Item.in_stock` or a per-warehouse
  qty lookup is a future tweak.

### Files of interest

```
nest_crm_mobile/
├── pyproject.toml
├── README.md
├── DEPLOY.md
├── CLAUDE.md                    <- you are here
├── license.txt
└── nest_crm_mobile/             <- Python package
    ├── __init__.py              (__version__ = "0.1.0")
    ├── hooks.py                 <- role_home_page, fixtures
    ├── modules.txt              <- "Mobile CRM"
    ├── patches.txt
    └── mobile_crm/              <- Frappe module folder
        └── page/crm_mobile/
            ├── crm_mobile.js    <- controller + INLINED HTML (the live source)
            ├── crm_mobile.html  <- DEAD placeholder only
            └── crm_mobile.json  <- page metadata, module="Mobile CRM"
```

## Phase 2 - planned (post-demo)

1. **Rebuild as Frappe Website route** at `/rep` so we can register a
   service worker and install as a PWA.
2. **Service worker** caches the app shell.
3. **IndexedDB** caches customer list, item list, and pending draft orders.
4. **Sync queue** posts queued orders to Sales Order endpoint when online.
5. **Pricing Rule + Customer Pricelist** resolution once client confirms
   their pricing strategy.
6. **Stock badge** (Available / Low / Out) on item list.
7. **Barcode scan** via `html5-qrcode` (same lib as production_floor).
8. **B2B Trade Portal** as a separate Frappe website module, reusing the
   shell + IndexedDB pattern but with the customer persona.

## Common follow-on tasks

- **Polish CSS / brand alignment** - ~30 min once we know the client's
  brand colours
- **Add stock badge** - ~30 min (single Item field lookup, add to render)
- **Add barcode scan to item search** - ~1 hour (port the html5-qrcode
  setup from production_floor)
- **Customer Pricelist resolution** - ~2 hours (server-side helper that
  takes customer + item + qty -> returns final rate after Pricing Rules)
- **Submit SO to docstatus=1 directly from the page** - ~15 min (change
  `frappe.client.insert` to a workflow that submits after insert)

## When the page renders blank, in order

1. DevTools -> **Console** -> look for `NestERP CRM Mobile loaded: vX.Y.Z`.
   If it is missing, the JS did not parse - look for red errors mentioning
   `crm_mobile` or `crmMobile`.
2. **Network** tab -> confirm `crm_mobile.js` returns 200 with the expected
   size (around 20 KB in v0.1.0). If 404 or much smaller, the deploy did
   not pick up the latest commit.
3. Check Frappe Cloud's most recent Deploy log -> confirm the commit hash
   matches `git log` head.
4. Open in **incognito** to rule out cache.
5. If the user cannot reach the page at all, check role assignment - they
   need Sales User, Sales Manager, or System Manager.
