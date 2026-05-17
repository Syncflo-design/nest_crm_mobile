# Deploy nest_crm_mobile to blomoplastics

Same pattern as `production_floor` and `wo_wip`. The bench iteration cycle on
Frappe Cloud is 5-10 minutes per change, so get it right per push.

## First-time install on a site

### 1. Push to GitHub

From Windows Git Bash, in `C:\Users\User\production_floor\nest_crm_mobile`:

```bash
cd /c/Users/User/production_floor/nest_crm_mobile
rm -f .git/config.lock          # always include - sandbox leaves stale locks
git init
git branch -M main
git remote add origin https://github.com/Syncflo-design/nest_crm_mobile.git
git add .
git commit -m "Initial commit - v0.1.0 online-only demo build"
git push --force -u origin main
```

(Create the `Syncflo-design/nest_crm_mobile` repo on GitHub first - empty, no
README, no .gitignore.)

### 2. Add to Frappe Cloud bench

- Bench dashboard for the relevant site (e.g. blomoplastics)
- **Apps** tab -> **Add App** -> **Public Source**
- Repository: `https://github.com/Syncflo-design/nest_crm_mobile`
- Branch: `main`
- Frappe Cloud will fetch and build the app into the bench (~3 min)

### 3. Install on the site

- Bench -> **Sites** -> blomoplastics
- **Installed Apps** -> **Install App** -> select `nest_crm_mobile`
- Click **Install** (~1 min)

### 4. Verify

- Open `https://blomoplastics.jh.frappe.cloud/desk/crm-mobile` in **incognito**
- Should land on the Customer list with seeded customers
- Tap a customer -> Customer 360 -> Start Order -> add items -> Submit
- New Sales Order appears at `/desk/sales-order`

## Update cycle (after the first install)

### All four steps matter

1. Commit + push to `Syncflo-design/nest_crm_mobile` `main`
2. Frappe Cloud -> **Bench** -> **Apps** -> **Pull Updates** on the nest_crm_mobile
   row. (Also surfaces as "Update Available".) **Skipping this is the #1 cause of
   "I pushed the fix but it's still broken."** Deploy does NOT pull on its own.
3. Frappe Cloud -> **Bench** -> **Deploy** -> wait for green tick. Click into
   the deploy log and verify the commit hash matches your latest push.
4. Frappe Cloud -> **Site** -> **Migrate** (only needed when fixtures, doctypes,
   or hooks change; for pure JS/HTML edits Migrate is optional).
5. Open `/desk/crm-mobile` in **incognito** to bypass cache.

Skip Migrate for JS-only edits. Never skip Pull Updates.

## How to verify the deployed version

The page logs a `BUILD_MARKER` to the browser console at load time. Open
DevTools -> Console -> reload the page. Expect:

```
NestERP CRM Mobile loaded: v0.1.0-2026-05-17
```

If the marker doesn't match the version you just pushed, the deploy didn't
pick up the latest commit - see step 2 above.

## Roles required

- **Sales User**, **Sales Manager**, or **System Manager** (page-level)

The `role_home_page` hook automatically lands Sales User / Sales Manager
on `/desk/crm-mobile` after login.

## Site prerequisites

- At least one **Customer** record (the page shows up to 100, sorted by
  modified date)
- At least one **Item** with `is_sales_item = 1` and `disabled = 0` (page
  shows up to 100, sorted alphabetically by item name)
- Stock UOM populated on each item (it shows in the cart line subtitle)

blomoplastics already meets all of these.

## Known limits (v0.1.0)

- Online-only. No offline / service worker / sync queue yet. Phase 2.
- Uses Item `standard_rate` as the line rate - no customer-specific pricelist
  resolution yet. POC-only; production will hook in Pricing Rule + Customer
  Pricelist when client confirms their pricing strategy.
- Stock badge is not shown - items render with name + rate + UOM only.
- No barcode scanning (the `html5-qrcode` lib from `production_floor` is
  available to layer in later).
- Submitted Sales Orders are created in **draft** state (`docstatus=0`).
  Submission to `docstatus=1` is a one-click action on the SO form, or can
  be wired into the page as a follow-up.
