/* Appearance switch shared by the site and the app: match system, light, dark.
   The choice is kept on this device only. */
(function () {
  var KEY = 'tablenote.theme', ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: 'Auto', light: 'Light', dark: 'Dark' };
  var ICON = {
    system: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  };
  function get() { try { var t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : 'system'; } catch (e) { return 'system'; } }
  function apply(t) {
    var root = document.documentElement;
    if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    var dark = t === 'dark' || (t === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', dark ? '#12141b' : '#f2f3ef'); });
    document.querySelectorAll('.theme-btn').forEach(function (b) {
      b.innerHTML = ICON[t] + '<span>' + LABEL[t] + '</span>';
      b.setAttribute('aria-label', 'Appearance: ' + (t === 'system' ? 'match system' : t) + '. Tap to change.');
    });
  }
  function set(t) { try { if (t === 'system') localStorage.removeItem(KEY); else localStorage.setItem(KEY, t); } catch (e) {} apply(t); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.theme-btn');
    if (!b) return;
    set(ORDER[(ORDER.indexOf(get()) + 1) % ORDER.length]);
  });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { apply(get()); });
  window.addEventListener('storage', function (e) { if (e.key === KEY) apply(get()); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { apply(get()); }); else apply(get());
})();
