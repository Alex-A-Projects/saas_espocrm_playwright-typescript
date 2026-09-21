# EspoCRM Playwright + TypeScript

Playwright framework for EspoCRM UI, REST API, and MariaDB testing. UI tests use Page Object Model classes. Database tests use a SELECT-only account; test data is created through EspoCRM rather than direct SQL inserts.

## Requirements

- Node.js 20+
- npm
- Docker Desktop or Docker Engine with Compose

## Local setup

```sh
npm ci
npx playwright install chromium firefox webkit
npm run local:init
npm run local:up
```

Open [http://localhost:8080](http://localhost:8080) and sign in with `ESPOCRM_ADMIN_USERNAME` and `ESPOCRM_ADMIN_PASSWORD` from `.env`.

The Docker stack includes EspoCRM, MariaDB, the EspoCRM daemon, and Mailpit. Mailpit is available at [http://localhost:8025](http://localhost:8025).

```sh
npm run local:logs       # Show container logs
npm run local:down       # Stop containers and preserve data
npm run local:up         # Start containers and verify readiness
npm run local:db-user    # Recreate the SELECT-only database user
```

## Run tests

```sh
npm run typecheck
npm test                       # Local UI, API, and database suites
npm run test:ui                # Local Chromium UI tests
npm run test:ui:demo           # Read-only public-demo tests
npm run test:ui:sales          # Sales Pack workflows
npm run test:api
npm run test:db
npm run test:smoke
npm run test:cross-browser     # Chromium, Firefox, and WebKit
npm run test:headed
npm run test:debug
npm run test:list
```

```sh
npm run report
npm run report:demo
npm run report:sales
```

Failures save screenshots and traces under `test-results/`. HTML reports are written to `playwright-report/`, `playwright-report-demo/`, and `playwright-report-sales/`.

## Test environments

### Local Docker

`npm test`, `npm run test:ui`, `npm run test:api`, and `npm run test:db` use the local EspoCRM installation. These suites cover record mutations, API persistence, and MariaDB validation.

Database tests reject nonlocal targets. Remote writes require `ALLOW_REMOTE_WRITES=true` in an authorized environment.

### Public demo

`npm run test:ui:demo` runs read-only tests against [https://demo.us.espocrm.com](https://demo.us.espocrm.com). It covers:

- Homepage, Sales, Analytics, Sales Manager, Call Center, and Projects dashboards
- Widgets, links, charts, menus, Calendar controls, and empty/loading/error states
- Accounts, Contacts, Leads, Opportunities, Emails, Meetings, Calls, Tasks, Cases, Knowledge Base, and Documents
- Opportunity kanban, Email folders, Knowledge Base categories, and Sales & Purchases links
- Search, Last Viewed, quick create, Notifications, Administration, Preferences, About, and Log Out

The demo suite does not save, edit, or delete shared records.

### Sales Pack

`npm run test:ui:sales` covers catalogs, sales and purchase documents, payments, inventory drafts, subscriptions, and Quote conversions. It creates uniquely named records and deletes only records owned by its fixture.

## Create local sample data

```sh
npm run seed:ui
HEADED=true npm run seed:ui
```

The script creates sample CRM records through the UI and verifies them through the API and MariaDB. IDs and screenshots are saved under `artifacts/seed/`.

## Project structure

```text
src/
  api/          API clients and cleanup
  config/       Environment configuration and target guards
  data/         Entity definitions and data factories
  db/           Read-only MariaDB client
  fixtures/     Local, demo, and Sales Pack fixtures
  pages/        Page Object Model classes
tests/
  ui/           Local Docker UI tests
  ui-demo/      Public-demo read-only tests
  ui-sales/     Sales Pack tests
  api/          REST API tests
  database/     Schema and persistence tests
scripts/        Setup, seed data, readiness, and OpenAPI export
```

## Coverage

- **780 local tests:** 412 UI, 241 API, and 127 database/integration
- **184 public-demo UI tests**
- **56 Sales Pack tests**

See [docs/ui-coverage.md](docs/ui-coverage.md) for page-by-page coverage.

## API and database configuration

The local OpenAPI document is available at `http://localhost:8080/api/v1/OpenApi`. Export it with:

```sh
npm run openapi:export
```

API and database settings are stored in `.env`. Start from `.env.example`; never commit `.env`.

## Adding tests

- Use `src/fixtures/ui-test` for authenticated local UI tests.
- Use `src/fixtures/demo-test` for public-demo read-only tests.
- Use `src/fixtures/sales-test` for Sales Pack workflows.
- Use `src/fixtures/test` for API and database tests.
- Keep selectors and browser actions in page objects.
- Use unique data and fixture-managed cleanup.

## References

- [EspoCRM Docker installation](https://docs.espocrm.com/administration/docker/installation/)
- [EspoCRM REST API](https://docs.espocrm.com/development/api/)
- [Playwright fixtures](https://playwright.dev/docs/test-fixtures)
