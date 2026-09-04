(function () {
  try {
    var r = document.documentElement;
    r.setAttribute('data-theme', 'original');
    localStorage.setItem('codecard-theme', 'original');
    if (localStorage.getItem('cc-app-appearance') === 'dark') r.classList.add('dark');
    var v = {
      '--bone': '#fcf1e7',
      '--paper': '#ffffff',
      '--ink': '#232324',
      '--canvas': '#fcf1e7',
      '--void-canvas': '#fcf1e7',
      '--background': '#fcf1e7',
      '--obsidian': '#fcf1e7',
      '--cosmic-base-start': '#fcf1e7',
      '--cosmic-base-mid': '#fafafa',
      '--cosmic-base-end': '#fcf1e7',
      '--text-primary': '#232324',
      '--vellum': '#232324',
      '--phosphor': '#232324',
      '--text-secondary': '#767073',
      '--smoke': '#767073',
      '--iris': '#e95a0b',
      '--accent': '#e95a0b',
      '--accent-rgb': '233, 90, 11',
      '--cosmic-glow': 'rgba(233, 90, 11, 0.14)',
      '--cosmic-glow-secondary': 'rgba(255, 183, 96, 0.12)',
    };
    for (var k in v) r.style.setProperty(k, v[k]);
  } catch (e) {}
})();
