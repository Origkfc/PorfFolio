// Apply the saved appearance before the body is painted.
(() => {
  let theme = 'dark';
  try { if (localStorage.getItem('origkfc-theme') === 'light') theme = 'light'; } catch {}
  function applyTheme(value) {
    theme = value === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.querySelector('#darkThemeStyles').media = theme === 'dark' ? 'all' : 'not all';
    document.querySelector('meta[name="theme-color"]').setAttribute('content', theme === 'dark' ? '#06131d' : '#bac5ce');
  }
  applyTheme(theme);
  document.addEventListener('DOMContentLoaded', () => {
    const choices = document.querySelectorAll('input[name="theme"]');
    choices.forEach(input => {
      input.checked = input.value === theme;
      input.addEventListener('change', () => {
        if (!input.checked) return;
        applyTheme(input.value);
        try { localStorage.setItem('origkfc-theme', theme); } catch {}
        document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
      });
    });
  });
})();
