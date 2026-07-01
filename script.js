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
    miniLabel.textContent = `發芽度 ${pct}%`;
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

  /* ================= INLINE EDIT MODE ================= */
  (() => {
    const EDIT_STORAGE_KEY = 'chemCamp2026Edits';

    // Whitelist of text-bearing elements that are safe to edit directly.
    // Deliberately excludes nav links, tab buttons, checkboxes, and the
    // toolbar itself so structural/interactive markup can't be broken.
    const EDITABLE_SELECTOR = [
      '#home h1', '#home .hero-sub',
      '.stat-label', '.stat-value',
      '.eyebrow', '.section-desc',
      '.card h3', '.card-body', '.card-addr',
      '.data-list dt', '.data-list dd',
      '.pin-list li', '.badge',
      '.warning-note',
      '.check-group h3', '.check-list span',
      '.tab-panel p', '.tab-panel li', '.tab-panel .note',
      'table caption', 'table th', 'table td',
      '.step-list li',
      '.site-footer p'
    ].join(', ');

    const editModeBtn = document.getElementById('editModeBtn');
    const editExtraBtns = document.getElementById('editExtraBtns');
    const exportBtn = document.getElementById('exportBtn');
    const resetEditsBtn = document.getElementById('resetEditsBtn');
    const toast = document.getElementById('editToast');
    let editMode = false;
    let toastTimer = null;

    function showToast(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    }

    // Assign a stable, deterministic id to every editable element based on
    // its DOM order — identical on every page load since content order
    // doesn't change, so it reliably maps back to saved edits.
    function tagEditableElements() {
      const els = Array.from(document.querySelectorAll(EDITABLE_SELECTOR));
      els.forEach((el, i) => {
        el.setAttribute('data-editable', '');
        if (!el.hasAttribute('data-edit-id')) {
          el.setAttribute('data-edit-id', `edit-${i}`);
        }
      });
      return els;
    }

    function loadEdits() {
      try {
        const raw = localStorage.getItem(EDIT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    }

    function saveEdits(edits) {
      try { localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(edits)); }
      catch (e) { /* storage unavailable, ignore */ }
    }

    function applySavedEdits(els) {
      const edits = loadEdits();
      els.forEach(el => {
        const id = el.getAttribute('data-edit-id');
        if (Object.prototype.hasOwnProperty.call(edits, id)) {
          el.innerHTML = edits[id];
          el.classList.add('edit-dirty');
        }
      });
    }

    const editableEls = tagEditableElements();
    applySavedEdits(editableEls);

    function setEditMode(on) {
      editMode = on;
      document.body.classList.toggle('edit-mode', on);
      editModeBtn.classList.toggle('is-active', on);
      editModeBtn.innerHTML = on
        ? '<span class="edit-icon" aria-hidden="true">✓</span> 完成編輯'
        : '<span class="edit-icon" aria-hidden="true">✎</span> 編輯模式';
      editExtraBtns.hidden = !on;
      editableEls.forEach(el => {
        el.setAttribute('contenteditable', on ? 'true' : 'false');
      });
      if (on) showToast('編輯模式已開啟：點文字即可修改，會自動儲存在這台裝置上');
    }

    editModeBtn.addEventListener('click', () => setEditMode(!editMode));

    let saveTimer = null;
    editableEls.forEach(el => {
      el.addEventListener('input', () => {
        el.classList.add('edit-dirty');
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const edits = loadEdits();
          edits[el.getAttribute('data-edit-id')] = el.innerHTML;
          saveEdits(edits);
          showToast('已自動儲存');
        }, 500);
      });
    });

    resetEditsBtn.addEventListener('click', () => {
      if (!confirm('確定要清除所有編輯過的文字，還原成原始內容嗎？')) return;
      localStorage.removeItem(EDIT_STORAGE_KEY);
      location.reload();
    });

    exportBtn.addEventListener('click', () => {
      const clone = document.documentElement.cloneNode(true);

      // strip transient editing state from the exported copy
      clone.querySelector('body').classList.remove('edit-mode');
      clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
      clone.querySelectorAll('.edit-dirty').forEach(el => el.classList.remove('edit-dirty'));
      const cloneEditBtn = clone.querySelector('#editModeBtn');
      if (cloneEditBtn) {
        cloneEditBtn.classList.remove('is-active');
        cloneEditBtn.innerHTML = '<span class="edit-icon" aria-hidden="true">✎</span> 編輯模式';
      }
      const cloneExtra = clone.querySelector('#editExtraBtns');
      if (cloneExtra) cloneExtra.setAttribute('hidden', '');

      const html = '<!DOCTYPE html>\n' + clone.outerHTML;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('已下載 index.html，請上傳覆蓋 GitHub 上的舊檔案');
    });
  })();

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
