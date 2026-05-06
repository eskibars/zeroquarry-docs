# ZeroQuarry Docs

Consumer documentation for ZeroQuarry, built with Docusaurus.

## Develop

```bash
npm install
npm run start
```

The `start` and `build` scripts copy the OpenAPI spec from the sibling
`security-bug-finder` checkout before generating the API reference into the
ignored `api/` directory.

When building outside `c:\Users\eskib\git-repos`, set one of:

```bash
ZEROQUARRY_OPENAPI_SPEC=/path/to/ZeroQuarry.spec.yml
ZEROQUARRY_APP_DIR=/path/to/security-bug-finder
```

## Build

```bash
npm run build
```

## Screenshots

Docs screenshots are generated from the production console with Playwright and
written to `static/img/screenshots/`.

Use a dedicated production docs account with public-safe demo data. The scripts
never store credentials; they use either a saved browser auth state or a session
cookie supplied by the environment.

First-time local setup:

```bash
npm install
npm run screenshots:install
npm run screenshots:auth
```

After signing in as the docs account, capture the current screenshot set:

```bash
npm run screenshots
```

CI can skip the interactive auth step by setting:

```bash
ZEROQUARRY_BASE_URL=https://console.zeroquarry.com
ZEROQUARRY_SESSION_COOKIE=...
```

Optional overrides:

- `ZEROQUARRY_AUTH_STATE`: saved Playwright storage state path
- `ZEROQUARRY_SCREENSHOT_DIR`: output directory
- `ZEROQUARRY_SCREENSHOT_HEADLESS=0`: show the browser during capture
- `ZEROQUARRY_SCREENSHOT_WIDTH` / `ZEROQUARRY_SCREENSHOT_HEIGHT`: viewport size
- `ZEROQUARRY_SCREENSHOT_REDACTIONS`: comma-separated text to replace with
  `[redacted]` before capture

Reference generated images from docs as `/img/screenshots/<name>.png`.

## Netlify

Use:

- Build command: `npm run build`
- Publish directory: `build`
