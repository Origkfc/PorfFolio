# ORIGKFC Portfolio

Static portfolio with an interactive Three.js logo and spatial project panels.

## Appearance and sound

Settings beside Sound offers Dark ice (default) and the original Light ice. The
choice is saved locally, applied before page content, and updates the existing
3D scene without restarting its particle wake or resetting chapter navigation.
Sound retains the approved 0.5 effects master; the button simply says On or Off.
The atmosphere remains quiet. Experimental HERO demos are not part of the site.

## Local preview and checks

Serve this directory with any static HTTP server, for example
`python -m http.server 4173 --bind 127.0.0.1`.

Run `node --test tests/theme.test.cjs` for appearance restoration, switching,
invalid values and unavailable storage. Run `node --check` on changed JavaScript.
Local QA scripts in ignored `qa/` additionally check orbit math, actual audio
nodes, and the theme/3D fixture at 320, 768, 1024 and 1440px.

## Deployment

The existing GitHub main branch deploys to
[origkfc-portfolio.vercel.app](https://origkfc-portfolio.vercel.app/).
Verify the new HTML and versioned theme, app, scene and orbit assets after pushing;
an HTTP 200 alone may still be the previous deployment. Smoke-test both themes,
Settings dismissal and Sound on the live site.

If appearance or navigation breaks in production, revert this release commit and
push the revert through the same deployment workflow. No data migration is needed.
