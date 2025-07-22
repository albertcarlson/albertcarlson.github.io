(function() {
  const root = document.documentElement;
  const nav  = document.querySelector('nav');

  // 1) --- Initialize theme from localStorage or prefers‑color‑scheme ---
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    root.classList.add('dark');
  }

  // 2) --- Create the toggle button and append to nav ---
  const btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.textContent = 'Toggle Theme';
  btn.setAttribute('aria-label', 'Toggle light/dark mode');
  nav.appendChild(btn);

  // 3) --- Wire up the click handler ---
  btn.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
})();
