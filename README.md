# ORIGKFC Portfolio

Static portfolio with an interactive Three.js logo and spatial project panels.

## Appearance and sound

Settings beside Sound offers Dark ice (default) and the original Light ice. The
choice is saved locally, applied before page content, and updates the existing
3D scene without restarting its particle wake or resetting chapter navigation.
Sound retains the approved 0.5 effects master. If the browser waits for a gesture,
the button says Enable sound; one click activates it. Loading plays only a short
TV-start sound when allowed, with ambience starting after the loading overlay fades.

## Project cards

Each project uses one distinct paragraph combining its purpose and Jeric's
planning, design, build and testing work.
BBSilog's Try me hint shows the public demo-only TEST account once per browser
session, with the live-demo link inside, manual reopening, individual Copy
buttons and Close/Escape.
It dismisses when leaving Projects. If clipboard access is unavailable, the
credentials remain selectable for manual copying. No POS login is performed.
The user confirmed this account is isolated from real sales/customer data.

## HERO and orbit sequence

The approved 3px dust trail captures fast cursor strokes and heals over 1.8 seconds.
About, Projects and Contact remain in the footer; the brand link returns home.
On desktop spatial layouts, five continuous full rotations in one direction start
an eight-second tornado. A one-second pause or a direction reversal resets the
rotation count. Panels, text and floating diamonds spiral inward; floor fissures
grow in the final three seconds. The rejected fullscreen particle pattern is absent.
The sequence ends with a TV-off effect/sound, two seconds of completely black,
silent screen, and one reload. The 20-click brand easter egg uses the same shutdown.
Reduced-motion and narrow layouts retain normal navigation without the orbit trigger.

## Local preview and checks

Serve this directory with any static HTTP server, for example
`python -m http.server 4173 --bind 127.0.0.1`.

Run `node --test tests/theme.test.cjs tests/orbit-overdrive.test.cjs` for appearance
restoration and continuous-orbit timing/reset/cancellation. Run `node --check` on
changed JavaScript.
Local QA scripts in ignored `qa/` additionally check orbit math, actual audio
nodes, and the theme/3D fixture at 320, 768, 1024 and 1440px.
`qa/project-demo.cjs` checks the real card renderer and demo controls in an
isolated fixture, including unavailable storage, copy denial and narrow screens.

## Deployment

The existing GitHub main branch deploys to
[origkfc-portfolio.vercel.app](https://origkfc-portfolio.vercel.app/).
Verify the new HTML and versioned theme, app, scene and orbit assets after pushing;
an HTTP 200 alone may still be the previous deployment. Smoke-test both themes,
Settings dismissal and Sound on the live site.
Release 1.1.0 promotes the approved local hover/tornado demo and project cards.

If appearance or navigation breaks in production, revert this release commit and
push the revert through the same deployment workflow. No data migration is needed.
