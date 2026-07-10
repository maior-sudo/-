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

  /* ---------- checklist persistence + progress ---------- */
  const checkboxes = Array.from(document.querySelectorAll('.check-list input[type="checkbox"]'));
  const liquid = document.getElementById('liquid');
  const progressPercent = document.getElementById('progressPercent');
  const miniFill = document.getElementById('miniProgressFill');
  const miniLabel = document.getElementById('miniProgressLabel');

  // beaker fluid geometry: top y=40, bottom y=254
  const BEAKER_TOP = 40;
  const BEAKER_BOTTOM = 254;

  const TOTAL_ITEMS = checkboxes.length;

  // Tracks the previous percentage so we only fire the popup once,
  // right when progress *crosses into* 100% (not on initial page load).
  let lastPct = null;

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
    const checkedCount = checkboxes.filter(cb => cb.checked).length;
    const total = TOTAL_ITEMS;
    const pct = total ? Math.round((checkedCount / total) * 100) : 0;

    const fillHeight = ((BEAKER_BOTTOM - BEAKER_TOP) * pct) / 100;
    liquid.setAttribute('y', BEAKER_BOTTOM - fillHeight);
    liquid.setAttribute('height', fillHeight);

    progressPercent.textContent = `${pct}%`;
    miniFill.style.width = `${pct}%`;
    miniLabel.textContent = `任務進度 ${pct}%`;

    const justReached100 = pct === 100 && lastPct !== null && lastPct !== 100;
    lastPct = pct;
    if (justReached100) openCompleteModal();
  }

  function initChecklist() {
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
  initChecklist();

  /* ---------- mission-complete popup ---------- */
  const completeModal = document.getElementById('completeModal');
  const completeBackdrop = document.getElementById('completeBackdrop');
  const completeCloseBtn = document.getElementById('completeCloseBtn');

  function openCompleteModal() {
    if (!completeModal) return;
    completeModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeCompleteModal() {
    if (!completeModal) return;
    completeModal.hidden = true;
    document.body.style.overflow = '';
  }

  if (completeBackdrop) completeBackdrop.addEventListener('click', closeCompleteModal);
  if (completeCloseBtn) completeCloseBtn.addEventListener('click', closeCompleteModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && completeModal && !completeModal.hidden) closeCompleteModal();
  });

  const closePageBtn = document.getElementById('closePageBtn');
  if (closePageBtn) {
    closePageBtn.addEventListener('click', () => {
      window.close();
      // Some browsers block window.close() on pages not opened via script;
      // fall back to a blank page so it at least feels "closed".
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 300);
    });
  }

  /* ---------- reset progress ---------- */
  const resetProgressBtn = document.getElementById('resetProgressBtn');
  if (resetProgressBtn) {
    resetProgressBtn.addEventListener('click', () => {
      const confirmed = window.confirm('確定要重置任務進度嗎？所有已勾選的裝備紀錄都會被清除，此動作無法復原。');
      if (!confirmed) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* storage unavailable — fail silently */
      }
      checkboxes.forEach(cb => { cb.checked = false; });
      closeCompleteModal();
      updateProgress();
    });
  }

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
