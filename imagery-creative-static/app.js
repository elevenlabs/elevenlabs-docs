(function() {
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const STORAGE = {
    user: 'ic_user',
    downloads: 'ic_download_log',
    collections: 'ic_collections',
    bannerDismissed: 'ic_banner_dismissed',
    consent: 'ic_consent',
    theme: 'ic_theme',
    library: 'ic_library',
    coursesProgress: 'ic_courses_progress'
  };

  const adminSettings = {
    emailVerificationMode: 'optional',
    requireVerificationFor: ['contributorUpload','profileEditSensitive','commenting'],
    freeDailyDownloadLimit: 50,
    premiumDailyDownloadLimit: 500
  };

  const state = {
    user: loadUser(),
    assets: buildAssets(),
    printables: buildPrintables(),
    courses: buildCourses(),
    collections: loadCollections(),
    pendingDownload: null
  };

  initTheme();
  mountNav();
  mountAuth();
  mountBanner();
  mountFilters();
  mountTabs();
  mountContribute();
  mountCookie();
  renderAll();
  injectStructuredData();

  function renderAll() {
    renderRoute();
    renderAssets();
    renderVideos();
    renderPrintables();
    renderPremiumSamples();
    renderCourses();
    renderCollections();
    updateVerifyBanner();
  }

  function loadUser() {
    const raw = localStorage.getItem(STORAGE.user);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  function saveUser(user) {
    localStorage.setItem(STORAGE.user, JSON.stringify(user));
    state.user = user;
  }

  function loadCollections() {
    const raw = localStorage.getItem(STORAGE.collections);
    try { return raw ? JSON.parse(raw) : []; } catch { return []; }
  }
  function saveCollections(list) {
    localStorage.setItem(STORAGE.collections, JSON.stringify(list));
    state.collections = list;
  }

  function getTodayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function getDownloadsToday() {
    const raw = localStorage.getItem(STORAGE.downloads);
    const map = raw ? JSON.parse(raw) : {};
    const key = getTodayKey();
    return map[key] || 0;
  }
  function incrementDownloadsToday() {
    const raw = localStorage.getItem(STORAGE.downloads);
    const map = raw ? JSON.parse(raw) : {};
    const key = getTodayKey();
    map[key] = (map[key] || 0) + 1;
    localStorage.setItem(STORAGE.downloads, JSON.stringify(map));
  }

  function showToast(message) {
    const el = qs('#toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  function mountNav() {
    qsa('a[data-route]').forEach(a => {
      on(a, 'click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          location.hash = href;
        }
      });
    });
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
    on(qs('#themeToggle'), 'click', toggleTheme);
    on(qs('#btnSignIn'), 'click', openAuth);
    on(qs('#btnJoin'), 'click', openAuth);
  }

  function renderRoute() {
    const route = location.hash.replace('#','') || 'browse';
    qsa('.view').forEach(v => v.classList.remove('active'));
    const target = qs(`#view-${route}`);
    if (target) target.classList.add('active');
  }

  function initTheme() {
    const t = localStorage.getItem(STORAGE.theme);
    if (t === 'dark') document.documentElement.classList.add('dark');
  }
  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem(STORAGE.theme, isDark ? 'dark' : 'light');
  }

  function openAuth() { qs('#authModal').showModal(); }
  function closeAuth() { try { qs('#authModal').close(); } catch {}
  }
  function mountAuth() {
    on(qs('#authSubmit'), 'click', (e) => {
      e.preventDefault();
      const email = qs('#authEmail').value.trim();
      const pwd = qs('#authPassword').value.trim();
      if (!email || !pwd) return;
      const newUser = { id: 'u_' + Date.now(), email, verified: false, premium: false, createdAt: Date.now() };
      saveUser(newUser);
      closeAuth();
      showToast('Signed in');
      updateVerifyBanner();
      resumePendingDownload();
    });
    on(qs('#authMagic'), 'click', (e) => { e.preventDefault(); showToast('Magic link sent to your email'); });
    on(qs('#authCode'), 'click', (e) => { e.preventDefault(); const ok = prompt('Enter code (try 123456)'); showToast(ok === '123456' ? 'Email verified' : 'Code sent'); if (ok === '123456' && state.user) { state.user.verified = true; saveUser(state.user); updateVerifyBanner(); } });
  }

  function updateVerifyBanner() {
    const banner = qs('#verifyBanner');
    const dismissed = localStorage.getItem(STORAGE.bannerDismissed) === '1';
    const shouldShow = !!state.user && !state.user.verified && adminSettings.emailVerificationMode !== 'off' && !dismissed;
    banner.classList.toggle('hidden', !shouldShow);
  }
  function mountBanner() {
    on(qs('#btnResendVerification'), 'click', () => showToast('Verification email sent'));
    on(qs('#btnDismissBanner'), 'click', () => { localStorage.setItem(STORAGE.bannerDismissed, '1'); updateVerifyBanner(); });
  }

  function mountFilters() {
    on(qs('#searchBtn'), 'click', renderAssets);
    on(qs('#searchInput'), 'keydown', (e) => { if (e.key === 'Enter') renderAssets(); });
    ['filterType','filterCategory','filterOrientation','filterSort'].forEach(id => on(qs('#' + id), 'change', renderAssets));
  }

  function buildAssets() {
    const cats = ['African','Latin','Caribbean','Drinks','Desserts','Street Food','Grill/BBQ','Seafood','Ingredients','Kitchen Scenes'];
    const list = [];
    let id = 1;
    for (let i = 0; i < 18; i++) {
      const category = cats[i % cats.length];
      const orientation = ['landscape','portrait','square'][i % 3];
      const premium = i % 5 === 0; // some premium
      const seed = i + 1;
      const baseSize = orientation === 'portrait' ? [800, 1000] : orientation === 'square' ? [900, 900] : [1200, 800];
      const mk = (w, h) => `https://source.unsplash.com/random/${w}x${h}/?tropical,food&sig=${seed}`;
      list.push({
        id: 'a' + id++,
        type: 'photo',
        premium,
        title: category + ' tropical dish ' + seed,
        author: premium ? 'Premium Chef' : 'Imagery Creator',
        category,
        tags: ['tropical','food',category.toLowerCase()],
        orientation,
        sizes: {
          small: mk(400, Math.round(baseSize[1] * 400 / baseSize[0])),
          medium: mk(800, Math.round(baseSize[1] * 800 / baseSize[0])),
          large: mk(1400, Math.round(baseSize[1] * 1400 / baseSize[0])),
          original: mk(baseSize[0]*2, baseSize[1]*2)
        },
        createdAt: Date.now() - i * 86400000,
        views: Math.floor(Math.random()*1000),
        likes: Math.floor(Math.random()*200)
      });
    }
    list.push({ id: 'v1', type: 'video', premium: false, title: 'Tropical smoothie pour', author: 'Imagery Creator', category: 'Drinks', tags: ['video','smoothie'], orientation: 'landscape', sizes: { mp4: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', webm: '', poster: 'https://source.unsplash.com/random/1200x800/?smoothie,tropical&sig=2001' }, createdAt: Date.now(), views: 500, likes: 40 });
    list.push({ id: 'v2', type: 'video', premium: true, title: 'Grilling jerk chicken', author: 'Premium Chef', category: 'Grill/BBQ', tags: ['video','jerk'], orientation: 'landscape', sizes: { mp4: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', webm: '', poster: 'https://source.unsplash.com/random/1200x800/?bbq,grill,caribbean&sig=2002' }, createdAt: Date.now()-86400000, views: 650, likes: 80 });
    return list;
  }

  function buildPrintables() {
    return [
      { id: 'p1', title: 'Latin Meal Prep Sauce Bible', price: 1900, media: 'https://source.unsplash.com/random/1000x700/?salsa,latin,food&sig=3001', includes: ['PDF eBook','Recipe cards','Sauce matrix'], license: 'Personal use' },
      { id: 'p2', title: 'Tropical Flavor Wheel Poster', price: 900, media: 'https://source.unsplash.com/random/1000x700/?tropical,fruit,poster&sig=3002', includes: ['A2 PDF','PNG high-res'], license: 'Personal use' },
      { id: 'p3', title: 'Kitchen Labels Pack', price: 700, media: 'https://source.unsplash.com/random/1000x700/?kitchen,labels&sig=3003', includes: ['Printable PDF','Editable PNG'], license: 'Personal use' }
    ];
  }

  function buildCourses() {
    return [
      { id: 'c1', title: 'Food Styling Basics', level: 'Beginner', duration: 120, cover: 'https://source.unsplash.com/random/1000x700/?food,styling&sig=4001', lessons: [ { id: 'l1', title: 'Lighting 101', duration: 12 }, { id: 'l2', title: 'Plating for Color', duration: 18 }, { id: 'l3', title: 'Props & Backgrounds', duration: 22 } ] },
      { id: 'c2', title: 'Tropical Lighting with Phone', level: 'Intermediate', duration: 95, cover: 'https://source.unsplash.com/random/1000x700/?tropical,lighting&sig=4002', lessons: [ { id: 'l1', title: 'Natural Light', duration: 16 }, { id: 'l2', title: 'Shade & Bounce', duration: 20 }, { id: 'l3', title: 'Editing Workflow', duration: 24 } ] }
    ];
  }

  function renderAssets() {
    const wrap = qs('#assetGrid'); if (!wrap) return; wrap.innerHTML = '';
    const query = qs('#searchInput').value.trim().toLowerCase();
    const type = qs('#filterType').value;
    const category = qs('#filterCategory').value;
    const orientation = qs('#filterOrientation').value;
    const sort = qs('#filterSort').value;

    let items = state.assets.filter(a => {
      return (type === 'all' || a.type === type)
        && (category === 'all' || a.category === category)
        && (orientation === 'all' || a.orientation === orientation)
        && (!query || (a.title + ' ' + (a.tags||[]).join(' ')).toLowerCase().includes(query));
    });
    items = items.filter(a => a.type === 'photo');

    items.sort((a,b) => sort === 'popular' ? (b.likes - a.likes) : (b.createdAt - a.createdAt));

    items.forEach(a => wrap.appendChild(renderAssetCard(a)));
  }

  function renderVideos() {
    const wrap = qs('#videoGrid'); if (!wrap) return; wrap.innerHTML = '';
    const items = state.assets.filter(a => a.type === 'video');
    items.forEach(a => wrap.appendChild(renderAssetCard(a)));
  }

  function renderAssetCard(asset) {
    const el = document.createElement('div');
    el.className = 'card asset';
    const badge = asset.premium ? '<div class="badge">Premium</div>' : '';
    const media = asset.type === 'photo'
      ? `<img alt="${escapeHtml(asset.title)}" loading="lazy" src="${asset.sizes.medium}" />`
      : `<img alt="${escapeHtml(asset.title)}" loading="lazy" src="${asset.sizes.poster}" />`;
    el.innerHTML = `${badge}${media}<div class="overlay"><div class="subtle">${escapeHtml(asset.author)}</div><div class="row gap"><button class="btn" data-action="open">Open</button><button class="btn btn-primary" data-action="download">Download</button></div></div>`;
    on(el, 'click', (e) => {
      const action = e.target.getAttribute && e.target.getAttribute('data-action');
      if (action === 'open') { e.preventDefault(); openAssetModal(asset); }
      if (action === 'download') { e.preventDefault(); startDownloadFlow(asset, asset.type === 'photo' ? 'large' : 'mp4'); }
    });
    return el;
  }

  function openAssetModal(asset) {
    qs('#assetTitle').textContent = asset.title;
    const prev = qs('#assetPreview');
    prev.innerHTML = asset.type === 'photo'
      ? `<img alt="${escapeHtml(asset.title)}" src="${asset.sizes.large}" />`
      : `<video controls playsinline poster="${asset.sizes.poster}"><source src="${asset.sizes.mp4}" type="video/mp4"></video>`;
    qs('#assetAuthor').textContent = asset.author;
    qs('#assetCategory').textContent = asset.category;
    qs('#assetTags').textContent = (asset.tags || []).join(', ');

    const setClick = (id, sizeKey) => on(qs(id), 'click', (e) => { e.preventDefault(); startDownloadFlow(asset, sizeKey); });
    setClick('#btnDownloadSmall', 'small');
    setClick('#btnDownloadMedium', 'medium');
    setClick('#btnDownloadLarge', 'large');
    setClick('#btnDownloadOriginal', asset.type === 'photo' ? 'original' : 'mp4');

    on(qs('#btnCopyCredit'), 'click', () => { navigator.clipboard.writeText(`"${asset.title}" by ${asset.author} via Imagery Creative`).then(()=>showToast('Credit copied')); });
    on(qs('#btnAddToCollection'), 'click', () => addToCollectionPrompt(asset));
    on(qs('#btnReport'), 'click', () => showToast('Reported. Thanks for the flag.'));

    qs('#assetModal').showModal();
    on(qs('#closeAsset'), 'click', () => { try { qs('#assetModal').close(); } catch {} });
  }

  function startDownloadFlow(asset, sizeKey) {
    if (!state.user) {
      state.pendingDownload = { assetId: asset.id, sizeKey };
      openAuth();
      return;
    }
    if (asset.premium && sizeKey === 'original' && !state.user.premium) {
      qs('#paywallModal').showModal();
      on(qs('#closePaywall'), 'click', () => { try { qs('#paywallModal').close(); } catch {} });
      on(qs('#upgradeNow'), 'click', () => { upgradeToPremium(); try { qs('#paywallModal').close(); } catch {} });
      return;
    }
    const isPremiumUser = !!state.user.premium;
    const limit = isPremiumUser ? adminSettings.premiumDailyDownloadLimit : adminSettings.freeDailyDownloadLimit;
    const used = getDownloadsToday();
    if (used >= limit) { showToast('Daily download limit reached'); return; }
    incrementDownloadsToday();
    beginDownload(asset, sizeKey);
  }

  function resumePendingDownload() {
    const p = state.pendingDownload;
    if (!p) return;
    const asset = state.assets.find(a => a.id === p.assetId);
    if (asset) startDownloadFlow(asset, p.sizeKey);
    state.pendingDownload = null;
  }

  function beginDownload(asset, sizeKey) {
    if (asset.type === 'photo') {
      const url = asset.sizes[sizeKey] || asset.sizes.large;
      const a = document.createElement('a');
      a.href = url + (url.includes('?') ? '&' : '?') + 'download=1';
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      showToast('Starting download…');
    } else {
      const url = asset.sizes.mp4;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
      showToast('Starting video download…');
    }
  }

  function addToCollectionPrompt(asset) {
    if (!state.user) { openAuth(); return; }
    let name = prompt('Add to collection. Enter name (existing will be reused):');
    if (!name) return;
    let cols = state.collections.slice();
    let col = cols.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (!col) { col = { id: 'c_' + Date.now(), name, items: [] }; cols.push(col); }
    if (!col.items.includes(asset.id)) col.items.push(asset.id);
    saveCollections(cols);
    renderCollections();
    showToast('Added to collection');
  }

  function renderCollections() {
    const list = qs('#collectionsList'); if (!list) return; list.innerHTML = '';
    state.collections.forEach(c => {
      const el = document.createElement('div'); el.className = 'card padded';
      const items = c.items.map(id => state.assets.find(a => a.id === id)).filter(Boolean);
      el.innerHTML = `<div class="row gap" style="justify-content:space-between;align-items:center"><strong>${escapeHtml(c.name)}</strong><button class=\"btn btn-ghost\" data-del>Delete</button></div><div class="grid" style="margin-top:8px">${items.slice(0,6).map(a => `<img alt="" src="${a.type==='photo'?a.sizes.small:a.sizes.poster}" style="width:100%;border-radius:12px" />`).join('')}</div>`;
      on(el.querySelector('[data-del]'), 'click', () => { if (confirm('Delete collection?')) { saveCollections(state.collections.filter(x => x.id !== c.id)); renderCollections(); }});
      list.appendChild(el);
    });
    on(qs('#createCollectionBtn'), 'click', () => {
      const name = qs('#newCollectionName').value.trim(); if (!name) return;
      saveCollections([...state.collections, { id: 'c_' + Date.now(), name, items: [] }]);
      qs('#newCollectionName').value = '';
      renderCollections();
    });
  }

  function renderPrintables() {
    const grid = qs('#printablesGrid'); if (!grid) return; grid.innerHTML = '';
    state.printables.forEach(p => {
      const price = p.price;
      const isSub = state.user && state.user.premium;
      const discounted = isSub ? Math.round(price * 0.75) : price;
      const el = document.createElement('div'); el.className = 'card padded';
      el.innerHTML = `<img alt="${escapeHtml(p.title)}" src="${p.media}" style="width:100%;border-radius:12px;margin-bottom:8px"/><div class="row gap" style="justify-content:space-between;align-items:center"><div><strong>${escapeHtml(p.title)}</strong><div class="subtle">${isSub?`<s>$${(price/100).toFixed(2)}</s> `:''}$${(discounted/100).toFixed(2)}</div></div><button class=\"btn btn-primary\" data-buy>Buy</button></div>`;
      on(el.querySelector('[data-buy]'), 'click', () => { addToLibrary(p); showToast('Purchased. Find it in your Library.'); });
      grid.appendChild(el);
    });
    on(qs('#goPremiumBtn'), 'click', () => upgradeToPremium());
    qsa('input[name="billing"]').forEach(r => on(r, 'change', () => qs('#premiumPrice').textContent = r.value === 'annual' ? '$120' : '$15'));
  }

  function renderPremiumSamples() {
    const grid = qs('#premiumSamples'); if (!grid) return; grid.innerHTML = '';
    state.assets.filter(a => a.premium && a.type==='photo').slice(0,8).forEach(a => grid.appendChild(renderAssetCard(a)));
  }

  function renderCourses() {
    const grid = qs('#coursesGrid'); if (!grid) return; grid.innerHTML = '';
    state.courses.forEach(c => {
      const el = document.createElement('div'); el.className = 'card padded';
      el.innerHTML = `<img alt="${escapeHtml(c.title)}" src="${c.cover}" style="width:100%;border-radius:12px;margin-bottom:8px"/><div class="row" style="justify-content:space-between;align-items:center"><div><strong>${escapeHtml(c.title)}</strong><div class="subtle">${c.level} • ${c.duration} min</div></div><button class=\"btn\" data-open>Open</button></div>`;
      on(el.querySelector('[data-open]'), 'click', () => openCourse(c));
      grid.appendChild(el);
    });
  }

  function openCourse(course) {
    qs('#courseTitle').textContent = course.title;
    const body = qs('#courseBody');
    const progress = loadCourseProgress(course.id);
    body.innerHTML = '<div class="stack">' + course.lessons.map((l, idx) => {
      const done = progress.includes(l.id);
      return `<label style="display:flex;align-items:center;gap:8px"><input type=\"checkbox\" data-lesson=\"${l.id}\" ${done?'checked':''}/> ${idx+1}. ${escapeHtml(l.title)} <span class=\"subtle\">(${l.duration}m)</span></label>`;
    }).join('') + '</div>';
    qsa('[data-lesson]', body).forEach(chk => on(chk, 'change', () => toggleLesson(course.id, chk.getAttribute('data-lesson'), chk.checked)));
    qs('#courseModal').showModal();
    on(qs('#closeCourse'), 'click', () => { try { qs('#courseModal').close(); } catch {} });
  }

  function loadCourseProgress(courseId) {
    const raw = localStorage.getItem(STORAGE.coursesProgress);
    const map = raw ? JSON.parse(raw) : {};
    return map[courseId] || [];
  }
  function toggleLesson(courseId, lessonId, checked) {
    const raw = localStorage.getItem(STORAGE.coursesProgress);
    const map = raw ? JSON.parse(raw) : {};
    const arr = new Set(map[courseId] || []);
    if (checked) arr.add(lessonId); else arr.delete(lessonId);
    map[courseId] = Array.from(arr);
    localStorage.setItem(STORAGE.coursesProgress, JSON.stringify(map));
  }

  function mountTabs() {
    qsa('.tab').forEach(t => on(t, 'click', () => {
      qsa('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      const name = t.getAttribute('data-tab');
      qsa('.tab-panel').forEach(p => p.classList.remove('active'));
      qs('#tab-' + name).classList.add('active');
    }));
  }

  function mountContribute() {
    on(qs('#submitContribution'), 'click', () => {
      if (!state.user) { openAuth(); return; }
      const requiresVerified = adminSettings.requireVerificationFor.includes('contributorUpload') && adminSettings.emailVerificationMode !== 'off';
      if (requiresVerified && !state.user.verified) { showToast('Verify your email to contribute'); return; }
      showToast('Submitted for moderation. Thanks!');
    });
  }

  function addToLibrary(product) {
    const raw = localStorage.getItem(STORAGE.library);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.find(i => i.id === product.id)) list.push({ id: product.id, title: product.title, ts: Date.now() });
    localStorage.setItem(STORAGE.library, JSON.stringify(list));
  }

  function upgradeToPremium() {
    if (!state.user) { openAuth(); return; }
    state.user.premium = true; saveUser(state.user);
    showToast('Premium activated');
    renderPrintables();
  }

  function mountCookie() {
    on(qs('#openCookie'), 'click', (e) => { e.preventDefault(); qs('#cookieModal').showModal(); });
    on(qs('#cookieAccept'), 'click', () => { localStorage.setItem(STORAGE.consent, 'accepted'); try { qs('#cookieModal').close(); } catch {} });
    on(qs('#cookieDecline'), 'click', () => { localStorage.setItem(STORAGE.consent, 'declined'); try { qs('#cookieModal').close(); } catch {} });
    const c = localStorage.getItem(STORAGE.consent);
    if (!c) setTimeout(()=>{ try { qs('#cookieModal').showModal(); } catch {} }, 600);
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, (m) => map[m]);
  }

  function injectStructuredData() {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Imagery Creative',
      url: location.href,
      potentialAction: { '@type': 'SearchAction', target: location.href + '#browse?q={query}', 'query-input': 'required name=query' }
    };
    qs('#structuredData').textContent = JSON.stringify(data);
  }
})();