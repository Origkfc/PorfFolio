# ORIGKFC — Frozen world

## Reference and intent
Igloo.inc was inspected visually: full-viewport 3D environment, fog, textured pale terrain, sculptural centerpiece, small peripheral interface, camera-led discovery. The centerpiece combines the original ORIGKFC mark with original procedural geometry.

## UI/UX Pro Max guidance applied
Queried `immersive 3D portfolio minimal --design-system --motion 8 --density 2`. Hero-centric pattern and minimalist controls fit. The initial generic orange CTA recommendation was rejected to avoid a stock marketing look; a restrained, high-contrast warm CTA is now used as the single action accent against the icy palette. No dashboard grid or oversized marketing headline in the opening view.

## Tokens
Frost #e9edf0; atmosphere #b9c4cf; graphite #233344; secondary #435466; cold white #f5fcff; ember #ba6c3d (sculpture only).
Display: Space Grotesk; utility: system monospace. Functional labels >=12px; body >=16px. Dark readable text on pale surfaces.

## Structure and motion
One persistent 3D chamber. Four chapters: Identity, About (experience/skills/CV), Projects, Contact. Native scroll drives a smoothed camera orbit and sculpture dispersion. Hovering the identity mark disperses its particles; leaving the mark lets them reform slowly. Cursor movement eases into the scene; drifting snow and crystal fragments vary gently rather than moving in lockstep. The supplied logo texture keeps the centerpiece recognizable through its particle treatment. On narrow screens, simplify the plinth and keep the fixed controls within the viewport. Explicit chapter links and arrows provide alternatives. Bottom loop occurs only on further user input after reaching the end. Contact form and dialog scrolling never trigger navigation.

## Quality requirements
No split words/letter-by-letter screen-reader labels. Native dialog focus/escape behavior. Motion toggle and prefers-reduced-motion both stop ambient movement. Rendering pauses in hidden tabs. WebGL failure leaves complete usable content. Essential loader waits on actual assets with a bounded fallback; no fake progress. Sound opt-in only. Contact opens an email draft and never claims delivery. Project records editable independently in content.js; no fabricated links or statistics.
