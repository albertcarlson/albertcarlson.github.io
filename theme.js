(function () {
  const KEY = "theme";

  // localStorage works on a real server (github.io) but is origin-isolated
  // per file path under file://.  window.name persists across same-tab
  // navigations with no origin restrictions, so it works as a fallback.
  function load() {
    try {
      const v = localStorage.getItem(KEY);
      if (v) return v;
    } catch (e) {}
    try {
      const d = JSON.parse(window.name || "{}");
      if (d[KEY]) return d[KEY];
    } catch (e) {}
    return null;
  }

  function save(val) {
    try { localStorage.setItem(KEY, val); } catch (e) {}
    try {
      const d = JSON.parse(window.name || "{}");
      d[KEY] = val;
      window.name = JSON.stringify(d);
    } catch (e) {}
  }

  // Apply before first paint (script must be in <head> for this to work)
  const saved = load();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (saved === "dark" || (!saved && prefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    function update() {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = dark ? sunIcon() : moonIcon();
    }

    btn.addEventListener("click", function () {
      const nowDark = document.documentElement.getAttribute("data-theme") === "dark";
      const next = nowDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      save(next);
      update();
    });

    update();
  });

  function moonIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  function sunIcon() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  }
})();
