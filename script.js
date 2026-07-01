(() => {
  const STORAGE_KEY = 'chemCamp2026Checklist';

  /* ---------- mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('sidebar');
  navToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- scroll-spy active nav link ---------- */
  const sections = document.querySelectorAll('main .section');
  const navLinks = document.querySelectorAll('.nav-link');
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spyObserver.observe(s));

  /* ---------- checklist persistence + beaker fill ---------- */
  const checkboxes = Array.from(document.querySelectorAll('.check-list input[type="checkbox"]'));
  const liquid = document.getElementById('liquid');
  const progressPercent = document.getElementById('progressPercent');
  const miniFill = document.getElementById('miniProgressFill');
  const miniLabel = document.getElementById('miniProgressLabel');

  // beaker fluid geometry: top y=30, bottom y=260 (height range ~230)
  const BEAKER_TOP = 40;
  const BEAKER_BOTTOM = 254;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — fail silently, state just won't persist */
    }
  }

  function updateProgress() {
    const total = checkboxes.length;
    const checked = checkboxes.filter(cb => cb.checked).length;
    const pct = total ? Math.round((checked / total) * 100) : 0;

    const fillHeight = ((BEAKER_BOTTOM - BEAKER_TOP) * pct) / 100;
    liquid.setAttribute('y', BEAKER_BOTTOM - fillHeight);
    liquid.setAttribute('height', fillHeight);

    progressPercent.textContent = `${pct}%`;
    miniFill.style.width = `${pct}%`;
    miniLabel.textContent = `${pct}% 完成`;
  }

  function init() {
    const state = loadState();
    checkboxes.forEach(cb => {
      const key = cb.dataset.item;
      if (state[key]) cb.checked = true;
      cb.addEventListener('change', () => {
        const s = loadState();
        s[key] = cb.checked;
        saveState(s);
        updateProgress();
      });
    });
    updateProgress();
  }
  init();

  /* ---------- transport tabs ---------- */
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
    });
  });
})();
