const wrap = (value, length) => ((value % length) + length) % length;
const clamp = value => Math.max(0, Math.min(1, value));

export const orbitChapter = phase => wrap(Math.round(phase), 3) + 1;

// Follow the third white floor ring to leave space around the sculpture.
export const orbitRadius = 6.33;
export function orbitPoint(index, phase) {
  const distance = wrap(index - phase + 1.5, 3) - 1.5;
  const angle = 70 * Math.PI / 180 + distance * Math.PI * 2 / 3;
  const fade = clamp((Math.abs(distance) - .24) / .46);
  return {
    distance,
    x: Math.sin(angle) * orbitRadius,
    y: -.04,
    z: Math.cos(angle) * orbitRadius,
    contentOpacity: 1 - fade * fade * (3 - 2 * fade),
  };
}

export function createSpatialPanels(chapters) {
  const wide = matchMedia('(min-width: 1100px) and (min-height: 700px)');
  const sections = chapters.slice(1);
  const panels = sections.map(section => section.querySelector('.glass-panel'));
  const names = ['About', 'Projects', 'Contact'];
  const summaries = panels.map((panel, index) => ({
    name: names[index],
    title: panel.querySelector('h2').innerText,
    description: panel.querySelector('p:not(.micro)').textContent,
  }));
  const dimensions = panels.map(() => ({ width: 440, height: 660 }));
  const observer = new ResizeObserver(entries => {
    for (const entry of entries) {
      const index = panels.indexOf(entry.target);
      dimensions[index] = { width: entry.target.offsetWidth, height: entry.target.offsetHeight };
    }
  });
  panels.forEach(panel => observer.observe(panel));
  let enabled = false, ready = false, start = 0, step = 1, phase = 0, reveal = 0;

  function refresh(motion) {
    const next = wide.matches && motion && ready;
    document.body.classList.toggle('spatial-ui', next);
    enabled = next;
    start = sections[0].offsetTop;
    step = Math.max(1, sections[1].offsetTop - start);
    if (!enabled) {
      chapters.forEach(section => { section.inert = false; section.removeAttribute('aria-hidden'); });
      panels.forEach(panel => {
        for (const name of ['--orbit-x','--orbit-y','--orbit-scale','opacity','visibility','z-index']) panel.style.removeProperty(name);
      });
    }
  }

  function update(y) {
    if (!enabled) return null;
    const entry = clamp(y / Math.max(1, start));
    reveal = clamp((entry - .18) / .82);
    phase = Math.max(0, (y - start) / step);
    const active = entry < .5 ? 0 : orbitChapter(phase);
    chapters.forEach((section, index) => {
      const inactive = index !== active;
      // A hidden orbit card must not receive Tab focus or retain a typing cursor.
      if (inactive && section.contains(document.activeElement)) document.activeElement.blur();
      section.inert = inactive;
      if (inactive) section.setAttribute('aria-hidden', 'true');
      else section.removeAttribute('aria-hidden');
    });
    return { chapter: active, heroProgress: entry };
  }

  // Scene projects the floor anchors with its actual camera, including pointer parallax.
  // Only the readable foreground uses live HTML; rear windows live in WebGL so
  // the hero and pedestal naturally occlude them instead of showing ghost text.
  function render(poses) {
    if (!enabled) return;
    poses.forEach((pose, index) => {
      const panel = panels[index];
      const opacity = pose.opacity;
      panel.style.setProperty('--orbit-x', `${pose.x.toFixed(2)}px`);
      panel.style.setProperty('--orbit-y', `${pose.y.toFixed(2)}px`);
      panel.style.setProperty('--orbit-scale', pose.scale.toFixed(4));
      panel.style.opacity = String(opacity);
      panel.style.visibility = opacity > .015 ? 'visible' : 'hidden';
      panel.style.zIndex = String(Math.round(30 * pose.scale));
    });
  }

  return {
    get enabled() { return enabled; },
    get bounds() { return { start, length: step * sections.length }; },
    get sceneState() { return { enabled, phase, reveal, dimensions }; },
    summaries,
    setReady(value) { ready = value; },
    refresh, update, render,
  };
}
