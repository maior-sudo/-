(() => {
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

  /* ---------- checklist persistence + progress + cloud sync ---------- */
  const STORAGE_KEY = 'chemCamp2026Checklist';
  const NAME_KEY = 'chemCamp2026StudentName';

  const checkboxes = Array.from(document.querySelectorAll('.check-list input[type="checkbox"]'));
  const liquid = document.getElementById('liquid');
  const progressPercent = document.getElementById('progressPercent');
  const miniFill = document.getElementById('miniProgressFill');
  const miniLabel = document.getElementById('miniProgressLabel');
  const studentNameInput = document.getElementById('studentNameInput');
  const studentNameConfirm = document.getElementById('studentNameConfirm');
  const nameGateStatus = document.getElementById('nameGateStatus');

  // beaker fluid geometry: top y=40, bottom y=254
  const BEAKER_TOP = 40;
  const BEAKER_BOTTOM = 254;

  const TOTAL_ITEMS = checkboxes.length;

  let currentName = null;   // display name, e.g. 王小明
  let dbRef = null;         // firebase ref for this student, once connected
  let suppressWrite = false; // true while applying data programmatically (avoid re-triggering writes)

  function sanitizeNameForKey(raw) {
    return raw.trim().replace(/[.#$\[\]/]/g, '_').slice(0, 60);
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveLocalState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — fail silently, state just won't persist */
    }
  }

  function updateProgress() {
    const checkedCount = checkboxes.filter(cb => cb.checked).length;
    const pct = TOTAL_ITEMS ? Math.round((checkedCount / TOTAL_ITEMS) * 100) : 0;

    const fillHeight = ((BEAKER_BOTTOM - BEAKER_TOP) * pct) / 100;
    liquid.setAttribute('y', BEAKER_BOTTOM - fillHeight);
    liquid.setAttribute('height', fillHeight);

    progressPercent.textContent = `${pct}%`;
    miniFill.style.width = `${pct}%`;
    miniLabel.textContent = `任務進度 ${pct}%`;
    return pct;
  }

  function applyState(dataObj) {
    suppressWrite = true;
    checkboxes.forEach(cb => {
      cb.checked = !!(dataObj && dataObj[cb.dataset.item]);
    });
    suppressWrite = false;
    updateProgress();
  }

  function currentCheckedMap() {
    const map = {};
    checkboxes.forEach(cb => { map[cb.dataset.item] = cb.checked; });
    return map;
  }

  function writeMetaToCloud(pct) {
    if (!dbRef || !currentName) return;
    dbRef.child('_meta').set({
      name: currentName,
      pct: pct,
      updatedAt: (window.firebase && firebase.database && firebase.database.ServerValue)
        ? firebase.database.ServerValue.TIMESTAMP
        : Date.now()
    }).catch(() => {});
  }

  function connectToCloud(rawName) {
    if (!window.firebase || !firebase.database) {
      if (nameGateStatus) nameGateStatus.textContent = '⚠️ 雲端服務載入失敗，目前僅會儲存在此裝置。';
      return;
    }
    const safeKey = sanitizeNameForKey(rawName);
    if (!safeKey) return;

    currentName = rawName.trim();
    dbRef = firebase.database().ref('progress/' + safeKey);
    if (nameGateStatus) nameGateStatus.textContent = '🔄 正在連結雲端進度...';

    dbRef.once('value').then(snapshot => {
      const data = snapshot.val();
      if (data) {
        applyState(data);
        saveLocalState(currentCheckedMap());
      } else {
        applyState(loadLocalState());
        dbRef.update(currentCheckedMap()).catch(() => {});
      }
      const pct = updateProgress();
      writeMetaToCloud(pct);
      if (nameGateStatus) nameGateStatus.textContent = `✅ 已連結「${currentName}」，進度會自動同步到雲端`;
    }).catch(() => {
      dbRef = null;
      if (nameGateStatus) nameGateStatus.textContent = '⚠️ 雲端連線失敗，目前僅會儲存在此裝置。';
    });
  }

  function bindCheckboxEvents() {
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        if (suppressWrite) return;
        const key = cb.dataset.item;

        saveLocalState(currentCheckedMap());
        const pct = updateProgress();

        if (dbRef) {
          const updates = {};
          updates[key] = cb.checked;
          dbRef.update(updates).catch(() => {});
          writeMetaToCloud(pct);
        }
      });
    });
  }

  function initChecklist() {
    applyState(loadLocalState());
    bindCheckboxEvents();

    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) {
      if (studentNameInput) studentNameInput.value = savedName;
      connectToCloud(savedName);
    }
  }
  initChecklist();

  if (studentNameConfirm) {
    studentNameConfirm.addEventListener('click', () => {
      const raw = studentNameInput.value;
      if (!raw.trim()) { studentNameInput.focus(); return; }
      localStorage.setItem(NAME_KEY, raw.trim());
      connectToCloud(raw);
    });
    studentNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') studentNameConfirm.click();
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
      updateProgress();
      if (dbRef) {
        const cleared = {};
        checkboxes.forEach(cb => { cleared[cb.dataset.item] = false; });
        dbRef.update(cleared).catch(() => {});
        writeMetaToCloud(0);
      }
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
