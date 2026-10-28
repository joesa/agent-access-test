# Playwright sandbox check — microsoft/playwright

Executed 2026-10-28 with the Playwright already installed in this sandbox.

| | |
|---|---|
| Playwright (npm) | 1.63.0 (global install at `/usr/local/lib/node_modules/playwright`) |
| **Chromium version** | **153.0.8010.12** (`browser.version()`, `chromium_headless_shell-1243` from `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`) |
| Node.js | v22.23.4 |
| Mode | headless, default launch (no extra flags) |

Reproduce with: `NODE_PATH=/usr/local/lib/node_modules node playwright-check/check.js`
(Raw machine-readable output: [`results.json`](results.json))

## Sandbox network caveat (affects item 1)

The sandbox egress proxy (`http://172.30.240.1:3128`) allows `github.com`,
`api.github.com` and `avatars.githubusercontent.com`, but **blocks
`github.githubassets.com`** — 270 subresource requests failed with
`net::ERR_TUNNEL_CONNECTION_FAILED` during the two GitHub page loads.

Consequences observed on the repository page:

* No CSS/JS is loaded, so the page renders as unstyled HTML (see `repo.png`).
* The sidebar **Releases** widget is a client-rendered React component, so it
  never hydrates and stays as skeleton placeholders:
  `<h2><span>Releases</span></h2>` + two `prc-SkeletonText` boxes, and
  `a[href*="/releases/tag/"]` matches **0** elements even after waiting 5 s.

Because the release name is therefore *not present* in the rendered repository
page, the latest release was read from GitHub pages that are server-rendered on
the same allowed host (`github.com`), cross-checked against `api.github.com`.

## 1. Repository description and latest release

* **Description** (server-rendered "About" section of
  https://github.com/microsoft/playwright, identical to `og:description` minus
  the site suffix):

  > Playwright is a framework for Web Testing and Automation. It allows testing
  > Chromium, Firefox and WebKit with a single API.

* Page `<title>`:
  `GitHub - microsoft/playwright: Playwright is a framework for Web Testing and Automation. It allows testing Chromium, Firefox and WebKit with a single API. · GitHub`

* **Latest release: `v1.64.1`**
  * `https://github.com/microsoft/playwright/releases/latest` → 302 →
    `https://github.com/microsoft/playwright/releases/tag/v1.64.1`
  * `<h1>` of that release page: `v1.64.1`
  * `api.github.com` `/repos/microsoft/playwright/releases/latest`:
    `tag_name: "v1.64.1"`, `name: "v1.64.1"`, `published_at: 2026-10-14T11:51:33Z`,
    `draft: false`, `prerelease: false`
  * Note: the release's *name* is the same string as its tag.

## 2. Image at https://github.com/joesa.png

| Property | Value |
|---|---|
| Request URL | `https://github.com/joesa.png` |
| Final URL (after redirect) | `https://avatars.githubusercontent.com/u/8756545?v=4` |
| HTTP status | 200 |
| **Content-Type** | **`image/jpeg`** (the `.png` URL actually serves a JPEG) |
| **Size** | **34,064 bytes** (`content-length` header; body downloaded in the browser was also 34,064 bytes) |
| **Pixel dimensions** | **460 x 460** (`naturalWidth` x `naturalHeight` of the loaded `<img>`) |

## 3. Saved artifacts

| File | Description | Pixels | Bytes |
|---|---|---|---|
| [`repo.png`](repo.png) | Full-page screenshot (`fullPage: true`) of https://github.com/microsoft/playwright, captured at 1440x900 CSS px with `deviceScaleFactor: 2` | 2880 x 23586 | 2,729,163 |
| [`avatar.png`](avatar.png) | Screenshot of the `<img>` element rendering https://github.com/joesa.png, captured at `deviceScaleFactor: 1` | 460 x 460 | 136,694 |

Both files are valid 8-bit RGB non-interlaced PNGs (verified via the PNG IHDR).
`avatar.png` is a PNG *screenshot* of the image (as requested by the `.png`
filename); the original bytes it depicts are JPEG.

## Assumptions made

1. "Latest release shown on the page" could not be read literally because the
   React Releases widget never renders in this sandbox (blocked asset host), so
   the value was taken from GitHub's own `/releases/latest` redirect target and
   release page heading, corroborated by the GitHub REST API.
2. The repository description was taken from the "About" section of the repo
   page (the page's own description), not from the README's intro text.
3. `avatar.png` was produced by screenshotting the rendered image element
   rather than by re-encoding the downloaded JPEG body, so the file is a real
   PNG even though the source is `image/jpeg`.
4. Screenshots were taken at `deviceScaleFactor: 2` for the repo page (retina
   legibility) and `1` for the avatar (so its pixel size matches the source
   image exactly).
