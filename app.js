const state = {
  section: 'Oracle',
  search: '',
  selected: null,
  theme: 'light',
  collapsed: false,
  reviewer: new Set(),
  quizz: new Set(),
};

const resources = [
  {
    id: 'vid-001',
    type: 'video',
    title: 'Regard fuyant',
    description: "Observation d'un regard évitant le contact visuel, associé à une attitude hésitante.",
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    tags: ['regard', 'hésitation', 'inconfort'],
  },
  {
    id: 'vid-002',
    type: 'video',
    title: "Mains croisées",
    description: "Personne assise avec les bras croisés serrés, évoquant une posture défensive.",
    mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    tags: ['bras croisés', 'défense', 'fermée'],
  },
  {
    id: 'pic-101',
    type: 'photo',
    title: "Main sur la nuque",
    description: 'Geste de frottement nuque/cheveux signalant un inconfort latent.',
    mediaUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
    thumbnail:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    tags: ['inconfort', 'apaisement', 'auto-contact'],
  },
  {
    id: 'pic-102',
    type: 'photo',
    title: 'Épaules relevées',
    description: 'Posture signalant un doute ou un manque de certitude.',
    mediaUrl: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=1200&q=80',
    thumbnail:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
    tags: ['doute', 'incertitude', 'tension'],
  },
];

const selectors = {
  content: document.getElementById('content'),
  navItems: document.querySelectorAll('.nav-item'),
  reviewerCount: document.getElementById('reviewerCount'),
  quizzCount: document.getElementById('quizzCount'),
  sectionLabel: document.getElementById('activeSectionLabel'),
  themeToggle: document.getElementById('toggleTheme'),
  sidebar: document.querySelector('.sidebar'),
  collapseButton: document.getElementById('collapseSidebar'),
  toast: document.getElementById('toast'),
};

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  selectors.themeToggle.textContent = theme === 'dark' ? 'Mode sombre' : 'Mode clair';
}

function toggleTheme() {
  setTheme(state.theme === 'dark' ? 'light' : 'dark');
}

function setSection(section) {
  state.section = section;
  state.selected = null;
  selectors.sectionLabel.textContent = section;
  selectors.navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });
  render();
}

function formatType(type) {
  return type === 'video' ? 'Vidéo' : 'Photo';
}

function showToast(message) {
  selectors.toast.textContent = message;
  selectors.toast.classList.add('show');
  setTimeout(() => selectors.toast.classList.remove('show'), 2300);
}

function kpiCard(label, value) {
  return `
    <div class="kpi">
      <div class="kpi__label">${label}</div>
      <div class="kpi__value">${value}</div>
    </div>
  `;
}

function renderOracle() {
  if (state.selected) {
    renderResourceDetail(state.selected);
    return;
  }

  const videoCount = resources.filter((r) => r.type === 'video').length;
  const photoCount = resources.filter((r) => r.type === 'photo').length;
  const filtered = resources.filter((r) =>
    state.search
      ? r.tags.some((tag) => tag.toLowerCase().includes(state.search.toLowerCase()))
      : true
  );

  selectors.content.innerHTML = `
    <div class="section-card">
      <div class="kpis">
        ${kpiCard('Vidéos référencées', videoCount)}
        ${kpiCard('Photos référencées', photoCount)}
        ${kpiCard('Filtrage actif', state.search ? 'Oui' : 'Non')}
      </div>
      <div class="search-bar">
        <input id="searchInput" placeholder="Rechercher par nomenclature (tags)" value="${state.search}" />
        <div class="pill">Recherche dynamique</div>
      </div>
      <div class="grid" id="resourceGrid"></div>
    </div>
  `;

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderOracle();
  });

  const grid = document.getElementById('resourceGrid');
  if (!filtered.length) {
    grid.innerHTML = '<div class="placeholder">Aucune ressource ne correspond à cette nomenclature.</div>';
    return;
  }

  grid.innerHTML = filtered
    .map(
      (res) => `
        <article class="card" data-id="${res.id}">
          <div class="card__thumb" style="background-image:url('${res.thumbnail}')"></div>
          <div class="badge badge--violet">${formatType(res.type)}</div>
          <h3>${res.title}</h3>
          <p class="muted">${res.description}</p>
          <div class="tags">${res.tags
            .map((t) => `<span class="badge badge--outline">${t}</span>`)
            .join('')}</div>
          <button class="button primary">Ouvrir</button>
        </article>
      `
    )
    .join('');

  grid.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const res = resources.find((r) => r.id === card.dataset.id);
      state.selected = res;
      renderOracle();
    });
  });
}

function renderResourceDetail(resource) {
  selectors.content.innerHTML = `
    <div class="section-card">
      <button class="button ghost" id="backToOracle">⟵ Retour</button>
      <div class="actions-bar">
        <button class="button" id="editResource">Edit</button>
        <button class="button" id="addToReview">To Review</button>
        <button class="button primary" id="addToQuizz">To Quizz</button>
      </div>
      <div class="resource-layout">
        <div class="media-frame">
          <h3>${resource.title}</h3>
          <p class="muted">${resource.description}</p>
          ${resource.type === 'video'
            ? `<video id="mediaPlayer" src="${resource.mediaUrl}" preload="metadata" controls></video>
               <div class="media-controls">
                  <button class="button ghost" id="stepBack">◀︎ -1 frame</button>
                  <button class="button" id="togglePlay">▶︎ / ❚❚</button>
                  <button class="button ghost" id="stepForward">+1 frame ▶︎</button>
               </div>`
            : `<img src="${resource.mediaUrl}" alt="${resource.title}" />`
          }
        </div>
        <aside class="annotation-panel">
          <h3>Nomenclatures</h3>
          <div class="tags">${resource.tags
            .map((t) => `<span class="badge badge--outline">${t}</span>`)
            .join('')}</div>
          <p class="muted" style="margin-top:12px;">Annotations attachées à la ressource.</p>
        </aside>
      </div>
    </div>
  `;

  document.getElementById('backToOracle').addEventListener('click', () => {
    state.selected = null;
    renderOracle();
  });

  document.getElementById('addToReview').addEventListener('click', () => {
    state.reviewer.add(resource.id);
    selectors.reviewerCount.textContent = state.reviewer.size;
    showToast('Ajouté à la liste Reviewer');
  });

  document.getElementById('addToQuizz').addEventListener('click', () => {
    state.quizz.add(resource.id);
    selectors.quizzCount.textContent = state.quizz.size;
    showToast('Ajouté à la liste Quizz');
  });

  document.getElementById('editResource').addEventListener('click', () => {
    const newTags = prompt('Modifier les tags (séparés par des virgules)', resource.tags.join(', '));
    if (newTags !== null) {
      resource.tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      showToast('Nomenclature mise à jour');
      renderResourceDetail(resource);
    }
  });

  if (resource.type === 'video') {
    const player = document.getElementById('mediaPlayer');
    const frame = 1 / 30;

    document.getElementById('togglePlay').addEventListener('click', () => {
      if (player.paused) {
        player.play();
      } else {
        player.pause();
      }
    });

    document.getElementById('stepBack').addEventListener('click', () => {
      player.pause();
      player.currentTime = Math.max(0, player.currentTime - frame);
    });

    document.getElementById('stepForward').addEventListener('click', () => {
      player.pause();
      player.currentTime = Math.min(player.duration || player.currentTime + frame, player.currentTime + frame);
    });
  }
}

function renderReviewer() {
  const selection = resources.filter((r) => state.reviewer.has(r.id));
  selectors.content.innerHTML = `
    <div class="section-card">
      <h2>Reviewer</h2>
      <p class="muted">Les ressources marquées pour relecture apparaîtront ici.</p>
      <div class="grid" id="reviewGrid"></div>
    </div>
  `;
  const grid = document.getElementById('reviewGrid');
  grid.innerHTML = selection.length
    ? selection
        .map(
          (res) => `
            <article class="card">
              <div class="badge badge--violet">${formatType(res.type)}</div>
              <h3>${res.title}</h3>
              <p class="muted">${res.description}</p>
              <div class="tags">${res.tags
                .map((t) => `<span class="badge badge--outline">${t}</span>`)
                .join('')}</div>
            </article>
          `
        )
        .join('')
    : '<div class="placeholder">Aucune ressource en relecture pour le moment.</div>';
}

function renderQuizz() {
  const selection = resources.filter((r) => state.quizz.has(r.id));
  selectors.content.innerHTML = `
    <div class="section-card">
      <h2>Quizz</h2>
      <p class="muted">Les ressources marquées pour les quiz futurs apparaîtront ici.</p>
      <div class="grid" id="quizzGrid"></div>
    </div>
  `;
  const grid = document.getElementById('quizzGrid');
  grid.innerHTML = selection.length
    ? selection
        .map(
          (res) => `
            <article class="card">
              <div class="badge badge--green">${formatType(res.type)}</div>
              <h3>${res.title}</h3>
              <p class="muted">${res.description}</p>
              <div class="tags">${res.tags
                .map((t) => `<span class="badge badge--outline">${t}</span>`)
                .join('')}</div>
            </article>
          `
        )
        .join('')
    : '<div class="placeholder">Aucune ressource ajoutée pour les quiz.</div>';
}

function render() {
  selectors.reviewerCount.textContent = state.reviewer.size;
  selectors.quizzCount.textContent = state.quizz.size;

  if (state.section === 'Oracle') renderOracle();
  if (state.section === 'Reviewer') renderReviewer();
  if (state.section === 'Quizz') renderQuizz();
}

function setupInteractions() {
  selectors.navItems.forEach((item) => {
    item.addEventListener('click', () => setSection(item.dataset.section));
  });

  selectors.themeToggle.addEventListener('click', toggleTheme);

  selectors.collapseButton.addEventListener('click', () => {
    state.collapsed = !state.collapsed;
    selectors.sidebar.classList.toggle('collapsed', state.collapsed);
  });
}

setTheme('light');
setupInteractions();
render();
