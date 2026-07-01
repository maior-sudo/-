(() => {
  const STORAGE_KEY = 'chemCamp2026Checklist';
  const TEAM_LOOKUP_KEY = '__teamLookupDone';

  /* ---------- roster data ---------- */
  const TEAMS = [
    {
      id: 1,
      leaders: ['林辰翰', '黃子凌', '張愛玲'],
      members: [
        { name: '張語呈', school: '崇實高工' },
        { name: '廖庭毅', school: '中壢高中' },
        { name: '蕭于祐', school: '鹿寮國中' },
        { name: '陳家儀', school: '淡水商工' },
        { name: '許莉筠', school: '正心高中' },
        { name: '葉庭瑄', school: '六家高中' },
        { name: '蕭辰瞳', school: '興華高中' }
      ]
    },
    {
      id: 2,
      leaders: ['過宥熙', '吳思涵', '謝宇嫻'],
      members: [
        { name: '周祐康', school: 'Tomahawk Creek Middle School' },
        { name: '張登傑', school: '西苑高中' },
        { name: '林守峻', school: '育達高中' },
        { name: '洪湘玲', school: '曉明女中' },
        { name: '陳之善', school: '屏東女中' },
        { name: '黃盈華', school: '虎尾高中' },
        { name: '黃莉淇', school: '龍津高中' }
      ]
    },
    {
      id: 3,
      leaders: ['吳叡安', '陳沐恩', '王思尹'],
      members: [
        { name: '盧孟池', school: '弘文高中' },
        { name: '吳宇哲', school: '中港高中' },
        { name: '羅盛昶', school: '台中一中' },
        { name: '吳文毓', school: '屏東女中' },
        { name: '王怡媃', school: '斗六高中' },
        { name: '林芯卉', school: '復興高中' },
        { name: '李苡榛', school: '興華高中' }
      ]
    },
    {
      id: 4,
      leaders: ['林宥丞', '廖彗妏', '許祐瑄'],
      members: [
        { name: '許賢量', school: '彰化高中' },
        { name: '賴威彬', school: '豐原高中' },
        { name: '何東諺', school: '正心中學' },
        { name: '許宇彤', school: '精誠中學' },
        { name: '霜芸淇', school: '大甲高中' },
        { name: '鍾兆芸', school: '虎尾高中' },
        { name: '梁瑋玲', school: '育達高中' }
      ]
    },
    {
      id: 5,
      leaders: ['江沁宸', '馮怡茹', '曾少君'],
      members: [
        { name: '尤允恩', school: '鳳山高中' },
        { name: '蔡勝馮', school: '彰化高中' },
        { name: '王王雙', school: '東莞台校' },
        { name: '盧語欣', school: '小港高中' },
        { name: '簡子亦', school: '屏東女中' },
        { name: '沈沛絜', school: '六家高中' },
        { name: '林昕緹', school: '育達高中' }
      ]
    }
  ];

  function normalize(str) {
    return (str || '').trim().replace(/\s+/g, '');
  }

  function findPerson(rawName) {
    const target = normalize(rawName);
    if (!target) return null;
    for (const team of TEAMS) {
      const leaderMatch = team.leaders.find(n => normalize(n) === target);
      if (leaderMatch) return { type: 'leader', team, name: leaderMatch };
      const memberMatch = team.members.find(m => normalize(m.name) === target);
      if (memberMatch) return { type: 'member', team, name: memberMatch.name };
    }
    return null;
  }

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

  /* ---------- checklist + team-lookup persistence, shared progress ---------- */
  const checkboxes = Array.from(document.querySelectorAll('.check-list input[type="checkbox"]'));
  const liquid = document.getElementById('liquid');
  const progressPercent = document.getElementById('progressPercent');
  const miniFill = document.getElementById('miniProgressFill');
  const miniLabel = document.getElementById('miniProgressLabel');

  // beaker fluid geometry: top y=40, bottom y=254
  const BEAKER_TOP = 40;
  const BEAKER_BOTTOM = 254;

  // Progress = checklist items + 1 virtual item for "found my squad at least once".
  const TOTAL_ITEMS = checkboxes.length + 1;

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
    const state = loadState();
    const checkedCount = checkboxes.filter(cb => cb.checked).length;
    const lookupDone = !!state[TEAM_LOOKUP_KEY];
    const total = TOTAL_ITEMS;
    const checked = checkedCount + (lookupDone ? 1 : 0);
    const pct = total ? Math.round((checked / total) * 100) : 0;

    const fillHeight = ((BEAKER_BOTTOM - BEAKER_TOP) * pct) / 100;
    liquid.setAttribute('y', BEAKER_BOTTOM - fillHeight);
    liquid.setAttribute('height', fillHeight);

    progressPercent.textContent = `${pct}%`;
    miniFill.style.width = `${pct}%`;
    miniLabel.textContent = `任務進度 ${pct}%`;
  }

  function markTeamLookupDone() {
    const s = loadState();
    if (!s[TEAM_LOOKUP_KEY]) {
      s[TEAM_LOOKUP_KEY] = true;
      saveState(s);
      updateProgress();
    }
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

  /* ---------- reset progress ---------- */
  const resetProgressBtn = document.getElementById('resetProgressBtn');
  if (resetProgressBtn) {
    resetProgressBtn.addEventListener('click', () => {
      const confirmed = window.confirm('確定要重置任務進度嗎？所有已勾選的裝備與查詢紀錄都會被清除，此動作無法復原。');
      if (!confirmed) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        /* storage unavailable — fail silently */
      }
      checkboxes.forEach(cb => { cb.checked = false; });
      updateProgress();
    });
  }

  /* ---------- team finder ---------- */
  const nameInput = document.getElementById('nameInput');
  const searchBtn = document.getElementById('searchTeamBtn');
  const resultBox = document.getElementById('teamResult');

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderOwnTeam(found) {
    const { team, name, type } = found;
    const leaderChips = team.leaders
      .map(l => `<span class="chip is-leader">${escapeHtml(l)}</span>`)
      .join('');
    const memberChips = team.members
      .map(m => {
        const isYou = normalize(m.name) === normalize(name);
        return `<span class="chip${isYou ? ' is-you' : ''}">${escapeHtml(m.name)}${isYou ? '（你）' : ''}</span>`;
      })
      .join('');
    const roleNote = type === 'leader' ? '（你是這個小隊的隊輔）' : '';

    resultBox.classList.remove('is-error');
    resultBox.innerHTML = `
      <span class="result-badge">✅ 找到了！</span>
      <h3 class="result-heading">第 ${team.id} 小隊 ${roleNote}</h3>
      <div class="result-block">
        <h4>隊輔小隊長</h4>
        <div class="chip-row">${leaderChips}</div>
      </div>
      <div class="result-block">
        <h4>同隊小隊員</h4>
        <div class="chip-row">${memberChips}</div>
      </div>
    `;
    resultBox.hidden = false;
    markTeamLookupDone();
  }

  function renderNotFound(rawName) {
    resultBox.classList.add('is-error');
    resultBox.innerHTML = `
      <span class="result-badge">🔍 沒有找到</span>
      <p class="result-error-text">找不到「${escapeHtml(rawName.trim())}」，請確認姓名是否與報名資料完全一致（含正確用字），或聯繫隊輔確認你的分隊。</p>
    `;
    resultBox.hidden = false;
  }

  const viewAllBtn = document.getElementById('viewAllBtn');

  function runSearch() {
    const raw = nameInput.value;
    if (!normalize(raw)) {
      nameInput.focus();
      return;
    }
    const found = findPerson(raw);
    if (found) {
      renderOwnTeam(found);
    } else {
      renderNotFound(raw);
    }
    viewAllBtn.hidden = false;
  }

  searchBtn.addEventListener('click', runSearch);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });

  /* ---------- all-teams modal ---------- */
  const modal = document.getElementById('allTeamsModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const allTeamsBody = document.getElementById('allTeamsBody');

  function buildAllTeamsMarkup() {
    return TEAMS.map(team => {
      const leaders = team.leaders.map(escapeHtml).join('、');
      const members = team.members
        .map(m => `<span class="chip">${escapeHtml(m.name)}<br><small>${escapeHtml(m.school)}</small></span>`)
        .join('');
      return `
        <article class="roster-group">
          <h4>第 ${team.id} 小隊</h4>
          <p class="roster-leaders">隊輔：<strong>${leaders}</strong></p>
          <div class="chip-row">${members}</div>
        </article>
      `;
    }).join('');
  }

  let modalBuilt = false;
  function openModal() {
    if (!modalBuilt) {
      allTeamsBody.innerHTML = buildAllTeamsMarkup();
      modalBuilt = true;
    }
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  viewAllBtn.addEventListener('click', openModal);
  modalBackdrop.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

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
