let seenThisSession = false;
const seenKey = 'origkfc-pos-demo-seen';

export function createProjectDemo(login, projectUrl) {
  try { seenThisSession ||= sessionStorage.getItem(seenKey) === 'true'; } catch {}
  const element = document.createElement('div');
  element.className = 'project-demo';
  element.innerHTML = `
    <button class="demo-trigger" type="button" aria-expanded="false" aria-controls="posDemoHint">Try me <span aria-hidden="true">↗</span></button>
    <aside class="demo-hint" id="posDemoHint" role="region" aria-labelledby="posDemoTitle" hidden>
      <button class="demo-close" type="button" aria-label="Close demo hint">×</button>
      <h4 id="posDemoTitle">Try the BBSilog demo</h4>
      <p class="demo-caption">A demo-only account with sample data.</p>
      <dl class="demo-credentials">
        <div><dt>Username</dt><dd><code data-credential="username"></code><button type="button" aria-label="Copy username">Copy</button></dd></div>
        <div><dt>Password</dt><dd><code data-credential="password"></code><button type="button" aria-label="Copy password">Copy</button></dd></div>
      </dl>
      <p class="demo-copy-status" role="status" aria-live="polite"></p>
    </aside>`;
  const trigger = element.querySelector('.demo-trigger');
  const hint = element.querySelector('.demo-hint');
  const status = element.querySelector('.demo-copy-status');
  if(projectUrl){
    const link=document.createElement('a');link.className='demo-open-project';
    link.href=projectUrl;link.target='_blank';link.rel='noopener noreferrer';
    link.textContent='Open BBSilog demo ↗';hint.append(link);
  }
  for (const field of ['username', 'password']) {
    element.querySelector(`[data-credential="${field}"]`).textContent = login[field];
    element.querySelector(`[aria-label="Copy ${field}"]`).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(login[field]);
        status.textContent = `${field === 'username' ? 'Username' : 'Password'} copied.`;
      } catch {
        status.textContent = 'Copy unavailable. Select TEST and copy manually.';
      }
    });
  }
  function open() {
    seenThisSession = true;
    try { sessionStorage.setItem(seenKey, 'true'); } catch {}
    status.textContent = '';
    hint.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  }
  function hide(restoreFocus = false) {
    hint.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => hint.hidden ? open() : hide());
  element.querySelector('.demo-close').addEventListener('click', () => hide(true));
  const outside = event => { if (!element.contains(event.target)) hide(); };
  const escape = event => {
    if (event.key === 'Escape' && !hint.hidden && !document.querySelector('dialog[open]')) {
      event.preventDefault(); hide(true);
    }
  };
  document.addEventListener('pointerdown', outside);
  document.addEventListener('keydown', escape);
  return {
    element,
    revealOnce() { if (!seenThisSession) open(); },
    hide,
    dispose() { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); },
  };
}
