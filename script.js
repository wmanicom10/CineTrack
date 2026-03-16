let state = {
  lists: [],
  activeList: null,
  filter: 'all',
  search: ''
};

async function save() {
  await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state.lists)
  });
}

async function loadFromServer() {
  const res = await fetch('/api/load');
  state.lists = await res.json();
  render();
}

function pct(seen, total) {
  if (!total) return 0;
  return Math.round(seen / total * 10000) / 100;
}

function seenCount(list) {
  return list.movies.filter(m => m.seen).length;
}

function renderSidebar() {
  const sb = document.getElementById('sidebar');
  let html = `
  <div style="margin-bottom:0.5rem"><span class="sidebar-section-title">Overview</span></div>
  <div class="list-item ${state.activeList === null ? 'active' : ''}" onclick="setList(null)">
      <div class="list-item-name">All Lists</div>
    </div>
  <div style="margin:0.5rem 0"><span class="sidebar-section-title">Lists</span></div>`;

  state.lists.forEach((list, i) => {
    const s = seenCount(list);
    const t = list.movies.length;
    const p = pct(s, t);
    const isActive = state.activeList === i;
    const isDone = p === 100;
    html += `<div class="list-item ${isActive ? 'active' : ''}"
      draggable="true"
      onclick="setList(${i})"
      ondragstart="onListDragStart(event, ${i})"
      ondragover="onListDragOver(event)"
      ondragleave="onListDragLeave(event)"
      ondrop="onListDrop(event, ${i})"
      ondragend="onListDragEnd(event)">
      <div class="list-item-name" style="${isDone ? 'color:var(--seen)' : ''}">${list.name}</div>
      <div class="list-item-stats">
        <div class="mini-bar"><div class="mini-bar-fill" style="width:${p}%;${isDone ? 'background:var(--seen)' : ''}"></div></div>
        <div class="mini-pct" style="${isDone ? 'color:var(--seen)' : ''}">${p}%</div>
      </div>
    </div>`;
  });
  sb.innerHTML = html;
}

function renderOverview() {
  const main = document.getElementById('main');
  let totalSeen = 0, totalMovies = 0;
  state.lists.forEach(l => { totalSeen += seenCount(l); totalMovies += l.movies.length; });

  let html = `
    <div style="margin-bottom:2rem;display:flex;align-items:center;justify-content:space-between">
      <h1 style="font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:2px;margin-bottom:0.25rem;font-weight:normal;">Movie Lists</h1>
      <div class="global-search-wrap">
        <input class="global-search-input" id="global-search" type="text" placeholder="Search any movie across all lists…" autocomplete="off" oninput="onGlobalSearch(this.value)" onkeydown="if(event.key==='Escape'){clearGlobalSearch()}">
        <div class="global-search-dropdown" id="gsd" style="display:none"></div>
      </div>
    </div>
    <div class="overview-grid">`;

  state.lists.forEach((list, i) => {
    const s = seenCount(list);
    const t = list.movies.length;
    const p = pct(s, t);
    const done = p === 100;
    html += `<div class="stat-card ${done ? 'complete' : ''}"
      draggable="true"
      onclick="setList(${i})"
      ondragstart="onListDragStart(event, ${i})"
      ondragover="onListDragOver(event)"
      ondragleave="onListDragLeave(event)"
      ondrop="onListDrop(event, ${i})"
      ondragend="onListDragEnd(event)">
      <div class="stat-card-name">${list.name}</div>
      <div class="stat-card-numbers">${s}<span style="font-size:1.1rem;color:var(--muted)">/${t}</span></div>
      <div class="progress-bar"><div class="progress-fill" style="width:${p}%"></div></div>
      <div class="stat-card-pct">${p}% complete</div>
    </div>`;
  });
  html += '</div>';
  main.innerHTML = html;
}

function buildMovieCards(idx, list) {
  let movies = [...list.movies];
  if (state.filter === 'seen') movies = movies.filter(m => m.seen);
  if (state.filter === 'unseen') movies = movies.filter(m => !m.seen);
  if (state.search) {
    const q = state.search.toLowerCase();
    movies = movies.filter(m => m.title.toLowerCase().includes(q));
  }
  return movies.map((m) => {
    const realIdx = list.movies.indexOf(m);
    return `<div class="movie-card ${m.seen ? 'seen' : 'unseen'}"
      draggable="true"
      data-idx="${realIdx}"
      onclick="showMovieMenu(${idx}, ${realIdx})"
      ondragstart="onDragStart(event, ${idx}, ${realIdx})"
      ondragover="onDragOver(event)"
      ondragleave="onDragLeave(event)"
      ondrop="onDrop(event, ${idx}, ${realIdx})"
      ondragend="onDragEnd(event)">
      <div class="movie-check" onclick="event.stopPropagation(); toggleMovie(${idx}, ${realIdx})"></div>
      <div class="movie-title">${m.title}</div>
    </div>`;
  }).join('');
}

function renderList() {
  const idx = state.activeList;
  const list = state.lists[idx];
  const main = document.getElementById('main');
  const s = seenCount(list);
  const t = list.movies.length;
  const p = pct(s, t);

  const movieCards = buildMovieCards(idx, list);

  main.innerHTML = `
    <div class="list-header">
      <div>
        <div class="list-title">${list.name}</div>
        <div class="list-subtitle">${s} seen · ${t - s} remaining · ${t} total</div>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button class="btn btn-ghost btn-sm" onclick="showAddMovieModal()">+ Add Movie</button>
        <button class="btn btn-ghost btn-sm" onclick="markAllSeen(${idx})">Mark All As Seen</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteList(${idx})">Delete List</button>
      </div>
    </div>

    <div class="list-big-progress">
      <div class="big-pct">${p}%</div>
      <div class="progress-info">
        <div class="progress-label">Progress</div>
        <div class="big-bar"><div class="big-bar-fill" style="width:${p}%"></div></div>
        <div class="progress-counts"><strong>${s}</strong> seen · <strong>${t - s}</strong> unseen · <strong>${t}</strong> total</div>
      </div>
    </div>

    <div class="filters">
      <button class="filter-btn ${state.filter==='all'?'active':''}" onclick="setFilter('all')">All (${t})</button>
      <button class="filter-btn ${state.filter==='seen'?'active':''}" onclick="setFilter('seen')">Seen (${s})</button>
      <button class="filter-btn ${state.filter==='unseen'?'active':''}" onclick="setFilter('unseen')">Unseen (${t-s})</button>
      <input class="search-input" id="list-search" type="text" placeholder="Search movies..." value="${state.search}" oninput="setSearch(this.value)">
    </div>

    <div class="movie-grid" id="movie-grid">
      ${movieCards || '<div class="empty">No movies match your filter.</div>'}
    </div>`;
}

function render() {
  renderSidebar();
  if (state.activeList === null) renderOverview();
  else renderList();
}

function setList(i) {
  state.activeList = i;
  state.filter = 'all';
  state.search = '';
  render();
}

function setFilter(f) {
  state.filter = f;
  render();
}

function setSearch(v) {
  state.search = v;
  const grid = document.getElementById('movie-grid');
  if (grid) {
    const cards = buildMovieCards(state.activeList, state.lists[state.activeList]);
    grid.innerHTML = cards || '<div class="empty">No movies match your filter.</div>';
  }
}

function toggleMovie(listIdx, movieIdx) {
  state.lists[listIdx].movies[movieIdx].seen = !state.lists[listIdx].movies[movieIdx].seen;
  save();
  render();
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

function showModal(html) {
  document.getElementById('modal-container').innerHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal" onclick="event.stopPropagation()">${html}</div>
    </div>`;
}

function showAddListModal() {
  showModal(`
    <h2>Add New List</h2>
    <div class="form-group">
      <label>List Name</label>
      <input class="form-input" id="new-list-name" placeholder="e.g. Oscar Best Director Nominees" autofocus>
    </div>
    <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem">
      <button class="filter-btn active" id="tab-manual" onclick="switchAddListTab('manual')">Type Manually</button>
      <button class="filter-btn" id="tab-csv" onclick="switchAddListTab('csv')">Import from CSV</button>
    </div>
    <div id="add-list-manual">
      <div class="form-group">
        <label>Movies (one per line)</label>
        <textarea class="form-input" id="new-list-movies" rows="10" placeholder="The Dark Knight&#10;Inception&#10;Parasite&#10;..." style="resize:vertical;font-size:0.85rem;line-height:1.6"></textarea>
      </div>
    </div>
    <div id="add-list-csv" style="display:none">
      <div class="import-area" onclick="document.getElementById('new-list-csv-input').click()">
        <div style="font-size:2rem;margin-bottom:0.5rem">📄</div>
        <div id="csv-drop-label">Click to select a CSV file</div>
        <input type="file" id="new-list-csv-input" accept=".csv" style="display:none" onchange="handleNewListCSV(this)">
      </div>
      <p class="import-note">CSV should have one movie title per row in the first column. No header row needed.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addList()">Create List</button>
    </div>
  `);
}

function switchAddListTab(tab) {
  const isManual = tab === 'manual';
  document.getElementById('add-list-manual').style.display = isManual ? '' : 'none';
  document.getElementById('add-list-csv').style.display = isManual ? 'none' : '';
  document.getElementById('tab-manual').className = 'filter-btn' + (isManual ? ' active' : '');
  document.getElementById('tab-csv').className = 'filter-btn' + (!isManual ? ' active' : '');
}

function handleNewListCSV(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split('\n')
      .map(l => l.replace(/^"|"$/g, '').trim())
      .filter(l => l.length > 0);
    document.getElementById('csv-drop-label').textContent = `✓ ${lines.length} movies loaded from ${file.name}`;
    document.getElementById('new-list-csv-input').dataset.movies = JSON.stringify(lines);
  };
  reader.readAsText(file);
}

function addList() {
  const name = document.getElementById('new-list-name').value.trim();
  if (!name) { document.getElementById('new-list-name').focus(); return; }

  const csvInput = document.getElementById('new-list-csv-input');
  const isCsvTab = document.getElementById('add-list-csv').style.display !== 'none';
  let movies = [];

  if (isCsvTab) {
    const data = csvInput.dataset.movies;
    if (!data) { alert('Please select a CSV file first.'); return; }
    movies = JSON.parse(data).map(title => ({ title, seen: false }));
  } else {
    const raw = document.getElementById('new-list-movies').value;
    movies = raw.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .map(title => ({ title, seen: false }));
  }

  state.lists.push({ name, movies });
  save();
  closeModal();
  state.activeList = state.lists.length - 1;
  render();
}

function showAddMovieModal() {
  const listOptions = state.lists.map((l, i) =>
    `<option value="${i}" ${state.activeList === i ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  showModal(`
    <h2>Add Movie</h2>
    <div class="form-group">
      <label>Movie Title(s) — one per line</label>
      <textarea class="form-input" id="new-movie-title" rows="5" placeholder="The Dark Knight&#10;Inception&#10;Parasite&#10;..." style="resize:vertical;font-size:0.85rem;line-height:1.6" autofocus></textarea>
    </div>
    <div class="form-group">
      <label>Add to List</label>
      <select class="form-input" id="new-movie-list">${listOptions}</select>
    </div>
    <div class="form-group">
      <label>Position</label>
      <select class="form-input" id="new-movie-position">
        <option value="beginning">Beginning of list</option>
        <option value="end">End of list</option>
      </select>
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" id="new-movie-seen">Seen
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="addMovie()">Add Movie</button>
    </div>
  `);
}

function addMovie() {
  const raw = document.getElementById('new-movie-title').value;
  const listIdx = parseInt(document.getElementById('new-movie-list').value);
  const seen = document.getElementById('new-movie-seen').checked;
  const position = document.getElementById('new-movie-position').value;
  const titles = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (!titles.length) return;
  const movies = titles.map(title => ({ title, seen }));
  if (position === 'beginning') {
    state.lists[listIdx].movies.splice(0, 0, ...movies);
  } else {
    state.lists[listIdx].movies.push(...movies);
  }
  save();
  closeModal();
  if (state.activeList !== listIdx) state.activeList = listIdx;
  render();
}

function markAllSeen(idx) {
  state.lists[idx].movies.forEach(m => m.seen = true);
  save();
  render();
}

function confirmDeleteList(idx) {
  showModal(`
    <h2>Delete List?</h2>
    <p style="color:var(--muted);font-size:0.9rem">Are you sure you want to delete "<strong style="color:var(--text)">${state.lists[idx].name}</strong>"? This cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="deleteList(${idx})">Delete</button>
    </div>
  `);
}

function deleteList(idx) {
  state.lists.splice(idx, 1);
  state.activeList = null;
  save();
  closeModal();
  render();
}

function confirmDeleteMovie(listIdx, movieIdx) {
  const title = state.lists[listIdx].movies[movieIdx].title;
  showModal(`
    <h2>Delete Movie?</h2>
    <p style="color:var(--muted);font-size:0.9rem">Remove "<strong style="color:var(--text)">${title}</strong>" from this list? This cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn btn-danger" onclick="deleteMovie(${listIdx}, ${movieIdx})">Delete</button>
    </div>
  `);
}

function deleteMovie(listIdx, movieIdx) {
  state.lists[listIdx].movies.splice(movieIdx, 1);
  save();
  closeModal();
  render();
}

function showMovieMenu(listIdx, movieIdx) {
  const movie = state.lists[listIdx].movies[movieIdx];
  showModal(`
    <h2>${movie.title}</h2>
    <div class="form-group">
      <label>Movie Title</label>
      <input class="form-input" id="edit-movie-title" value="${movie.title}">
    </div>
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" id="edit-movie-seen" ${movie.seen ? 'checked' : ''}>Seen
      </label>
    </div>
    <div class="modal-actions" style="justify-content:space-between">
      <button class="btn btn-danger" onclick="confirmDeleteMovie(${listIdx}, ${movieIdx})">Delete</button>
      <div style="display:flex;gap:0.75rem">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveMovieMenu(${listIdx}, ${movieIdx})">Save</button>
      </div>
    </div>
  `);
}

function saveMovieMenu(listIdx, movieIdx) {
  const title = document.getElementById('edit-movie-title').value.trim();
  const seen = document.getElementById('edit-movie-seen').checked;
  if (!title) return;
  state.lists[listIdx].movies[movieIdx].title = title;
  state.lists[listIdx].movies[movieIdx].seen = seen;
  save();
  closeModal();
  render();
}

let dragListSrcIdx = null;

function onListDragStart(e, listIdx) {
  dragListSrcIdx = listIdx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
  e.stopPropagation();
}

function onListDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
  e.stopPropagation();
}

function onListDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onListDrop(e, targetIdx) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  if (dragListSrcIdx === null || dragListSrcIdx === targetIdx) return;
  const moved = state.lists.splice(dragListSrcIdx, 1)[0];
  state.lists.splice(targetIdx, 0, moved);
  if (state.activeList === dragListSrcIdx) {
    state.activeList = targetIdx;
  } else if (state.activeList !== null) {
    if (dragListSrcIdx < state.activeList && targetIdx >= state.activeList) state.activeList--;
    else if (dragListSrcIdx > state.activeList && targetIdx <= state.activeList) state.activeList++;
  }
  dragListSrcIdx = null;
  save();
  render();
}

function onListDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.list-item, .stat-card').forEach(c => c.classList.remove('drag-over'));
}

let dragSrcIdx = null;

function onDragStart(e, listIdx, movieIdx) {
  dragSrcIdx = movieIdx;
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging');
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function onDrop(e, listIdx, targetIdx) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
  const movies = state.lists[listIdx].movies;
  const moved = movies.splice(dragSrcIdx, 1)[0];
  movies.splice(targetIdx, 0, moved);
  dragSrcIdx = null;
  save();
  render();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.movie-card').forEach(c => c.classList.remove('drag-over'));
}

let _suppressDropdownClose = false;

function markMovieSeenAll(entryRefs, btn) {
  event.stopPropagation();
  const entries = entryRefs.split(';').map(ref => ref.split(',').map(Number));
  const allSeen = entries.every(([li, mi]) => state.lists[li].movies[mi].seen);
  entries.forEach(([li, mi]) => {
    state.lists[li].movies[mi].seen = !allSeen;
  });
  const nowSeen = !allSeen;
  btn.className = 'gsd-toggle ' + (nowSeen ? 'seen' : 'unseen');
  btn.textContent = nowSeen ? '✓ Seen' : '○ Not Seen';
  btn.style.fontSize = '0.72rem';
  save();
  renderSidebar();
  if (state.activeList !== null) {
    const idx = state.activeList;
    const list = state.lists[idx];
    const s = seenCount(list);
    const t = list.movies.length;
    const p = pct(s, t);
    const subtitle = document.querySelector('.list-subtitle');
    const bigPct = document.querySelector('.big-pct');
    const bigBarFill = document.querySelector('.big-bar-fill');
    const progressCounts = document.querySelector('.progress-counts');
    if (subtitle) subtitle.textContent = `${s} seen · ${t - s} remaining · ${t} total`;
    if (bigPct) bigPct.textContent = `${p}%`;
    if (bigBarFill) bigBarFill.style.width = `${p}%`;
    if (progressCounts) progressCounts.innerHTML = `<strong>${s}</strong> seen · <strong>${t - s}</strong> unseen · <strong>${t}</strong> total`;
    const grid = document.getElementById('movie-grid');
    if (grid) grid.innerHTML = buildMovieCards(idx, list) || '<div class="empty">No movies match your filter.</div>';
  } else {
    document.querySelectorAll('.stat-card').forEach((card, i) => {
      const list = state.lists[i];
      if (!list) return;
      const s = seenCount(list);
      const t = list.movies.length;
      const p = pct(s, t);
      const done = p === 100;
      card.className = 'stat-card' + (done ? ' complete' : '');
      card.querySelector('.stat-card-numbers').innerHTML = `${s}<span style="font-size:1.1rem;color:var(--muted)">/${t}</span>`;
      card.querySelector('.progress-fill').style.width = `${p}%`;
      card.querySelector('.stat-card-pct').textContent = `${p}% complete`;
    });
  }
}

function onGlobalSearch(q) {
  const gsd = document.getElementById('gsd');
  q = q.trim();
  if (!q) { gsd.style.display = 'none'; return; }

  const ql = q.toLowerCase();
  const grouped = {};

  state.lists.forEach((list, li) => {
    list.movies.forEach((m, mi) => {
      if (m.title.toLowerCase().includes(ql)) {
        const key = m.title.toLowerCase();
        if (!grouped[key]) grouped[key] = { title: m.title, entries: [] };
        grouped[key].entries.push({ li, mi, seen: m.seen, listName: list.name });
      }
    });
  });

  const keys = Object.keys(grouped);
  if (!keys.length) {
    gsd.innerHTML = `<div class="gsd-no-results">No movies found matching "<strong>${q}</strong>"</div>`;
    gsd.style.display = 'block';
    return;
  }

  keys.sort((a, b) => {
    const aExact = a === ql ? 0 : 1;
    const bExact = b === ql ? 0 : 1;
    return aExact - bExact || a.localeCompare(b);
  });

  let html = `<div class="gsd-header">${keys.length} movie${keys.length>1?'s':''} found</div>`;
  keys.forEach(key => {
    const g = grouped[key];
    const allSeen = g.entries.every(e => e.seen);
    const entryRefs = g.entries.map(e => `${e.li},${e.mi}`).join(';');
    html += `<div class="gsd-movie-group">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
        <div class="gsd-movie-title" style="margin-bottom:0">${highlight(g.title, q)}</div>
        <button class="gsd-toggle ${allSeen ? 'seen' : 'unseen'}" style="font-size:0.72rem" onclick="event.stopPropagation(); markMovieSeenAll('${entryRefs}', this)">
          ${allSeen ? '✓ Seen' : '○ Not Seen'}
        </button>
      </div>`;
    g.entries.forEach(e => {
      html += `<div class="gsd-list-row">
        <button class="gsd-go-list" onclick="event.stopPropagation(); setList(${e.li});clearGlobalSearch()">${e.listName}</button>
      </div>`;
    });
    html += '</div>';
  });

  gsd.innerHTML = html;
  gsd.style.display = 'block';
}

function highlight(title, q) {
  const idx = title.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return title;
  return title.slice(0, idx) + `<mark style="background:var(--accent);color:#0a0a0f;border-radius:2px;padding:0 2px">${title.slice(idx, idx + q.length)}</mark>` + title.slice(idx + q.length);
}

function globalToggle(li, mi, btn) {
  state.lists[li].movies[mi].seen = !state.lists[li].movies[mi].seen;
  const nowSeen = state.lists[li].movies[mi].seen;
  btn.className = 'gsd-toggle ' + (nowSeen ? 'seen' : 'unseen');
  btn.textContent = nowSeen ? '✓ Seen' : '○ Unseen';
  save();
  if (state.activeList !== null) renderList();
  else renderOverview();
  renderSidebar();
}

function clearGlobalSearch() {
  document.getElementById('global-search').value = '';
  document.getElementById('gsd').style.display = 'none';
}

document.addEventListener('click', (e) => {
  const gsd = document.getElementById('gsd');
  if (!gsd || gsd.style.display === 'none') return;
  const wrap = document.getElementById('global-search')?.closest('.global-search-wrap');
  if (wrap && wrap.contains(e.target)) return;
  gsd.style.display = 'none';
});

loadFromServer();