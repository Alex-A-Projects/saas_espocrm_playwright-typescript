# UI coverage by page

All browser interactions are implemented in page objects under `src/pages/` and injected through fixtures. API calls prepare independent records, verify saved values, and remove records owned by the test. Create-workflow assertions exercise the browser's fields and Save action.

## Local core application

Run `npm run local:up`, then `npm run test:ui`. The 412 local Chromium scenarios include the shared entity matrix plus the specialized workflows below. The same scenarios are configured for Firefox and WebKit with `npm run test:cross-browser`.

| Page | Workflows covered | Test files under `tests/ui/` |
| --- | --- | --- |
| Accounts | Create/read/edit/reload/cancel, duplicate, Save & New/Continue, delete/cancel delete, search, validation, type/industry dropdowns, addresses, email, assignment | `records`, `record-actions`, `lists`, `fields`, `dropdowns`, `business-workflows` |
| Contacts | Shared lifecycle/list workflows, independent first/last names, email validation, Account selection/removal, addresses, assignment | Same shared files |
| Leads | Shared lifecycle/list workflows, status/source, independent names, assignment, conversion into Contact, Account, or both; conversion cancellation | Shared files and `business-workflows` |
| Opportunities | Shared lifecycle/list workflows, stages, amount boundaries, account selection/removal, assignment, Won/Lost probability | Shared files and `business-workflows` |
| Emails | Seven folders; create/edit/cancel drafts; To/CC/BCC; Unicode body; attachment upload; required subject/recipient; canceled/confirmed deletion; send and verify receipt in Mailpit | `emails` |
| Calendar | Month/Week/Timeline, previous/next/Today, opening Meeting/Call events in Month and Week, rename and datepicker reschedule reflected on calendar | `navigation`, `calendar-events` |
| Meetings | Shared lifecycle/list workflows, status, required assignee, Account parent, calendar event details and rescheduling | Shared files, `business-workflows`, `calendar-events` |
| Calls | Shared lifecycle/list workflows, status/direction, required assignee, Account parent, calendar event details and rescheduling | Shared files, `business-workflows`, `calendar-events` |
| Tasks | Shared lifecycle/list workflows, status/priority, required assignee, Account parent | Shared files and `business-workflows` |
| Cases | Shared lifecycle/list workflows, status/priority/type, account selection/removal, assignment | Shared files |
| Knowledge Base | Shared lifecycle/list workflows, create/edit/cancel rich text, title validation, status, assignment | Shared files |
| Documents | TXT/CSV/Unicode upload and content retrieval; required name/file/publish date; status/type; replace file; edit/cancel; search/delete | `documents` |

Shared files also cover Campaigns and Target Lists. Authentication/session isolation and dashboard/sidebar checks are in `auth` and `navigation`.

## Sales & Purchases

Run `npm run test:ui:sales`. These 56 Chromium tests use the Sales Pack installed on `https://demo.us.espocrm.com`. The local core Docker image does not include that extension. This is an explicit opt-in mutation suite: fixtures use the demo login, create unique records, track their IDs, and delete only those records during teardown. Each test has a fresh browser context. Sales reports are separate from local reports.

| Pages | Workflows covered | Test files under `tests/ui-sales/` |
| --- | --- | --- |
| Products, Suppliers, Warehouses | Create, rename, reload, cancel edit, search, delete, required name, inactive status; Supplier requires Account | `catalogs` |
| Quotes, Sales Orders, Invoices, Credit Notes, Return Orders, Purchase Orders, Bills, Supplier Credits | Draft creation with two items, quantity recalculation, persisted totals, cancel edit, deletion; 10% tax arithmetic; missing item name validation | `transactions` |
| Quote → Sales Order / Invoice | Select source Quote, wait for copied items, verify source relationship and copied names/totals | `conversions` |
| Payments, Payment Requests | Draft creation with owned payment method; amount editing; reload/delete; required method and amount | `payments` |
| Delivery Orders, Receipt Orders, Transfer Orders, Inventory Adjustments | Draft creation with owned Product/Warehouse, item quantities, description edits, reload/delete, required warehouse; transfer uses two warehouses | `inventory` |
| Inventory Numbers | Batch creation for an owned product, expiration edit, delete, required name/product | `inventory` |
| Subscriptions | Draft recurring product with owned billing plan and tax profile, price entry, edit/reload/delete, required billing plan/tax | `subscriptions` |

The separate `npm run test:ui:demo` suite contains 184 read-only dashboard, sidebar, header, list/search, and create-form checks. Thirty-two dashboard tests cover Homepage, Sales, Analytics, Sales Manager, Call Center, Projects, every configured widget heading, links and record/report drill-downs, charts, Calendar paging, Show more, widget dropdown actions and options, both overflow commands, empty/loading/error states, sequential tab switching, and sidebar Home return behavior. Another 65 tests enter every pictured sidebar module and cover list or kanban content, search restoration, record navigation, row selection, create/cancel dialogs, Calendar views and controls, Email folders and compose, Knowledge Base categories, and every Sales & Purchases child link. Twenty-one header tests cover search suggestions and record navigation, Last Viewed, all quick-create entries, Notifications, Administration, Preferences, About, and Log Out. It saves no records.

## Execution and remaining coverage

Configured: **780 default tests** (412 UI + 241 API + 127 database/integration), plus **56 sales UI** and **184 read-only demo UI** tests. Test count is not a percentage of product coverage.

Focused local validation passed **90 tests** (63 new scenarios and 27 existing field scenarios) in 2.7 minutes. The final picker synchronization also passed a separate 12-test check. The complete Sales Pack suite passed **56 tests** in **5.5 minutes**, with no failures, skipped tests, or flaky tests. TypeScript validation passed. The final full local regression invocation was declined before execution. See the README verification paragraph for the focused runs completed after these changes. The previous 717-test local baseline and 66-test read-only demo baseline passed before the additions. Cross-browser projects are configured; the new scenarios were verified in Chromium.

Not covered by these workflows: external IMAP ingestion, OAuth mail providers, replies/forwarding to external recipients, attachment malware scanning, every role/ACL combination, recurring Calendar invitations/timezone combinations, every Sales Pack settings combination, issuance/posting/payment settlement, completed stock movements and their generated Inventory Transactions, and real payment gateways. Financial, inventory, and subscription workflow tests currently exercise drafts; they do not activate recurring billing or move existing demo stock. Load/performance and accessibility audits are separate work.

## Local mail setup

`npm run local:up` starts Mailpit and configures EspoCRM's local SMTP account. For an existing running stack, use `docker compose up -d mailpit` followed by `npm run local:mail`. View captured messages at **http://localhost:8025**. SMTP is `mailpit:1025` inside Docker and is not published as a host port. No external SMTP credentials are required.
