/* Tablenote MVP — local-first SOAP charting.
   Everything lives in localStorage on this device; nothing is sent anywhere. */
(function () {
  'use strict';

  var KEY = 'tablenote.v1';
  var view = document.getElementById('view');
  var saveState = document.getElementById('save-state');

  var MODALITIES = ['Swedish', 'Deep tissue', 'Sports', 'Myofascial release', 'Trigger point', 'Prenatal', 'Lymphatic drainage', 'Hot stone', 'Other'];
  var DURATIONS = [30, 45, 60, 75, 90, 120];
  var PRESSURE = ['Light', 'Light-med', 'Medium', 'Firm', 'Deep'];
  var SOAP = [
    { k: 's', letter: 'S', title: 'Subjective', help: 'what the client reports',
      chips: ['Low back pain', 'Stiff neck on waking', 'Headaches', 'Desk work 8 h/day', 'Training for an event', 'Poor sleep', 'Requested firm pressure', 'Pain since last visit'] },
    { k: 'o', letter: 'O', title: 'Objective', help: 'what you observed or palpated',
      chips: ['Hypertonicity', 'Trigger point', 'Tenderness on palpation', 'Limited ROM', 'Adhesions', 'Forward head posture', 'Elevated shoulder', 'Edema'] },
    { k: 'a', letter: 'A', title: 'Assessment', help: 'how the tissue responded',
      chips: ['Tissue responded well', 'ROM improved', 'Pain decreased', 'Tolerated pressure well', 'Mild soreness expected', 'Little change this session'] },
    { k: 'p', letter: 'P', title: 'Plan', help: 'next visit and home care',
      chips: ['Return in 1 week', 'Return in 2 weeks', 'Return in 4 weeks', 'Home stretch daily', 'Heat 15 min', 'Hydrate', 'Refer to PT/physician if no change'] }
  ];

  /* ---------- storage ---------- */
  function blank() { return { clients: [], notes: [], settings: { therapist: '', credential: '', business: '', lastBackupAt: null }, seeded: false }; }
  var storageOK = true;
  var db = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        var b = blank();
        b.clients = d.clients || []; b.notes = d.notes || [];
        b.settings = Object.assign(b.settings, d.settings || {}); b.seeded = !!d.seeded;
        return b;
      }
    } catch (e) { storageOK = false; }
    var fresh = blank();
    seed(fresh);
    return fresh;
  }

  var saveTimer = null;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); storageOK = true; }
    catch (e) { storageOK = false; }
    showSave();
  }
  function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 350); }
  function showSave() {
    saveState.classList.toggle('bad', !storageOK);
    saveState.firstChild.textContent = storageOK ? 'Saved on this device' : "Not saved. This browser is blocking storage";
    saveState.classList.add('flash');
    setTimeout(function () { saveState.classList.remove('flash'); }, 500);
  }

  /* ---------- helpers ---------- */
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return isoDay(new Date()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoDay(d); }
  function fmtDate(iso, short) {
    if (!iso) return '';
    var p = iso.split('-'); var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-US', short ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function slug(s) { return String(s || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'; }
  function client(id) { return db.clients.find(function (c) { return c.id === id; }); }
  function note(id) { return db.notes.find(function (n) { return n.id === id; }); }
  function notesFor(cid) { return db.notes.filter(function (n) { return n.clientId === cid; }).sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || 0) - (a.createdAt || 0); }); }
  function isBlank(n) { return !n.s && !n.o && !n.a && !n.p && !(n.marks && n.marks.length) && n.painBefore == null && n.painAfter == null; }
  function realNotes() { return db.notes.filter(function (n) { return !n.example; }); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }

  function seed(d) {
    var cid = 'ex-jordan';
    d.clients.push({ id: cid, name: 'Jordan Lee', phone: '(555) 014-2290', email: 'jordan@example.com',
      history: 'Desk job, about 8 hours a day. Runs 3 times a week. Prefers firm pressure on back and shoulders.',
      contra: 'Varicose veins behind L knee. Light pressure only on posterior L leg.', example: true, createdAt: Date.now() });
    function mk(view, x, y, type) { return { id: uid(), view: view, x: x, y: y, type: type, region: BodyChart.region(view, x, y) }; }
    d.notes.push({ id: uid(), clientId: cid, example: true, date: daysAgo(5), duration: 60, modality: 'Deep tissue', pressure: 4, painBefore: 6, painAfter: 3,
      s: 'Stiff neck on waking; worse after long days at the desk. Pain 6/10 at worst. Requested firm pressure.',
      o: 'Hypertonicity in bilateral upper trapezius, R > L. Trigger point R rhomboids. Cervical rotation limited to the L.',
      a: 'Tissue responded well. Cervical ROM improved. Pain 3/10 after session.',
      p: 'Return in 2 weeks. Home stretch: upper trap, 3 × 30 s daily. Heat 15 min in the evening.',
      marks: [mk('back', 122, 98, 'pain'), mk('back', 78, 98, 'pain'), mk('back', 115, 124, 'tension'), mk('back', 82, 324, 'avoid')], createdAt: Date.now() - 2 });
    d.notes.push({ id: uid(), clientId: cid, example: true, date: daysAgo(19), duration: 90, modality: 'Swedish', pressure: 3, painBefore: 4, painAfter: 2,
      s: 'Low back tight after a long run. No numbness or tingling.',
      o: 'Tenderness on palpation, L quadratus lumborum. Mild hypertonicity in gluteals.',
      a: 'Tolerated pressure well. Mild soreness expected.',
      p: 'Return in 2 weeks. Hydrate. Hip flexor stretch after runs.',
      marks: [mk('back', 72, 190, 'pain'), mk('back', 116, 222, 'tension'), mk('back', 82, 324, 'avoid')], createdAt: Date.now() - 1 });
    d.seeded = true;
  }

  /* ---------- routing ---------- */
  var openNoteId = null;
  var ui = { editingClient: false, search: '', pendingRestore: null };

  function parse() { return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); }

  function route() {
    var parts = parse();
    // Leaving an untouched new note removes it, so empty visits don't pile up
    if (openNoteId && !(parts[0] === 'note' && parts[1] === openNoteId)) {
      var n = note(openNoteId);
      if (n && isBlank(n)) { db.notes = db.notes.filter(function (x) { return x !== n; }); save(); }
      openNoteId = null;
    }
    document.title = 'Tablenote';
    if (parts[0] === 'client' && parts[1] === 'new') renderNewClient();
    else if (parts[0] === 'client' && client(parts[1])) parts[2] === 'print' ? renderPrintClient(parts[1]) : renderClient(parts[1]);
    else if (parts[0] === 'note' && note(parts[1])) parts[2] === 'print' ? renderPrintNote(parts[1]) : renderNote(parts[1]);
    else if (parts[0] === 'data') renderData();
    else renderList();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { ui.editingClient = false; ui.pendingRestore = null; route(); });

  /* ---------- views ---------- */
  function backupBanner() {
    var real = realNotes().length;
    if (!real) return '';
    var last = db.settings.lastBackupAt;
    var stale = !last || (Date.now() - last) > 7 * 864e5;
    if (!stale) return '';
    return '<div class="notice warn"><p><b>' + (last ? 'Last backup ' + fmtDate(isoDay(new Date(last))) + '.' : 'No backup yet.') + '</b> Notes are stored only in this browser. Download a backup file once a week.</p><button class="btn small" data-action="backup">Download backup</button></div>';
  }

  function renderList() {
    var hasExample = db.clients.some(function (c) { return c.example; });
    var q = ui.search.trim().toLowerCase();
    var rows = db.clients.map(function (c) { var ns = notesFor(c.id); return { c: c, ns: ns, last: ns[0] ? ns[0].date : '' }; })
      .filter(function (r) { return !q || r.c.name.toLowerCase().indexOf(q) > -1; })
      .sort(function (a, b) { return a.last < b.last ? 1 : a.last > b.last ? -1 : a.c.name.localeCompare(b.c.name); });
    var h = '';
    if (hasExample) h += '<div class="notice"><p>Jordan Lee is an <b>example client</b> so you can see how notes look. Remove it whenever you like.</p><button class="btn small quiet" data-action="remove-examples">Remove example</button></div>';
    h += backupBanner();
    h += '<div class="page-head"><div><h1>Clients</h1><p class="sub">' + plural(db.clients.length, 'client') + ' · ' + plural(db.notes.length, 'note') + '</p></div><a class="btn" href="#/client/new">New client</a></div>';
    if (db.clients.length) {
      h += '<label class="field"><span class="label">Find a client</span><input type="search" id="search" placeholder="Search by name" value="' + esc(ui.search) + '" autocomplete="off"></label>';
      if (rows.length) {
        h += '<ul class="clients">' + rows.map(function (r) {
          return '<li><a href="#/client/' + r.c.id + '"><span class="name">' + esc(r.c.name) + (r.c.example ? ' <span class="tag">Example</span>' : '') + (r.c.contra ? '<span class="flag">Precautions</span>' : '') + '</span>' +
            '<span class="meta">' + (r.ns.length ? plural(r.ns.length, 'visit') + (r.ns[0].modality ? ' · last: ' + esc(r.ns[0].modality) : '') : 'No visits yet') + '</span>' +
            '<span class="when">' + (r.last ? fmtDate(r.last, true) : '—') + '</span></a></li>';
        }).join('') + '</ul>';
      } else {
        h += '<p class="hint">No client matches “' + esc(ui.search) + '”.</p>';
      }
    } else {
      h += '<div class="empty"><h2>No clients yet</h2><p>Add your first client, then start a SOAP note right after the session.</p><a class="btn" href="#/client/new">Add a client</a></div>';
    }
    view.innerHTML = h;
  }

  function clientForm(c) {
    c = c || {};
    return '<form class="form" id="client-form" novalidate>' +
      '<label class="field"><span>Name</span><input type="text" id="cf-name" name="name" required autocomplete="off" value="' + esc(c.name) + '" placeholder="First and last name"></label>' +
      '<p class="hint" id="cf-error" hidden style="color:var(--pain)">Add the client\'s name to save.</p>' +
      '<div class="grid2"><label class="field"><span>Phone</span><input type="tel" id="cf-phone" name="phone" value="' + esc(c.phone) + '"></label>' +
      '<label class="field"><span>Email</span><input type="email" id="cf-email" name="email" value="' + esc(c.email) + '"></label></div>' +
      '<label class="field"><span>Health history</span><textarea id="cf-history" name="history" placeholder="Occupation, activity, injuries, surgeries, medications">' + esc(c.history) + '</textarea></label>' +
      '<label class="field"><span>Precautions &amp; contraindications</span><textarea id="cf-contra" name="contra" placeholder="e.g. pregnancy, varicose veins, recent surgery, allergies to oils">' + esc(c.contra) + '</textarea><small>Shown at the top of every note for this client.</small></label>' +
      '<div class="actions"><button class="btn" type="submit">' + (c.id ? 'Save details' : 'Add client') + '</button>' +
      (c.id ? '<button class="btn small danger" type="button" data-action="delete-client" data-id="' + c.id + '">Delete client</button>' : '') + '</div></form>';
  }

  function renderNewClient() {
    view.innerHTML = '<a class="back" href="#/">← Clients</a><div class="page-head"><h1>New client</h1></div>' + clientForm();
    document.getElementById('cf-name').focus();
  }

  function renderClient(id) {
    var c = client(id), ns = notesFor(id);
    var h = '<a class="back" href="#/">← Clients</a>';
    h += '<div class="page-head"><div><h1>' + esc(c.name) + (c.example ? ' <span class="tag">Example</span>' : '') + '</h1><p class="sub">' + (ns.length ? plural(ns.length, 'visit') + ' · last ' + fmtDate(ns[0].date) : 'No visits yet') + '</p></div>' +
      '<button class="btn" data-action="new-note" data-id="' + id + '">New SOAP note</button></div>';
    if (c.contra && !ui.editingClient) h += '<div class="caution"><span class="label">Precautions</span>' + esc(c.contra) + '</div>';
    if (ui.editingClient) {
      h += clientForm(c);
    } else {
      h += '<dl class="facts">' +
        (c.phone ? '<div><dt class="label">Phone</dt><dd>' + esc(c.phone) + '</dd></div>' : '') +
        (c.email ? '<div><dt class="label">Email</dt><dd>' + esc(c.email) + '</dd></div>' : '') +
        '<div><dt class="label">Health history</dt><dd>' + (c.history ? esc(c.history) : '<span style="color:var(--ink-2)">Not recorded</span>') + '</dd></div></dl>' +
        '<div class="row"><button class="btn small quiet" data-action="edit-client">Edit details</button>' + (ns.length ? '<a class="btn small quiet" href="#/client/' + id + '/print">Print or save all visits</a>' : '') + '</div>';
    }
    h += '<h2 class="sec">Visits</h2>';
    if (ns.length) {
      h += '<ul class="visits">' + ns.map(function (n) {
        var pain = (n.painBefore != null || n.painAfter != null) ? 'pain ' + (n.painBefore != null ? n.painBefore : '–') + '→' + (n.painAfter != null ? n.painAfter : '–') : '';
        var first = (n.s || n.o || n.a || n.p || '').split(/[.;\n]/)[0];
        return '<li><a href="#/note/' + n.id + '"><span class="d">' + fmtDate(n.date) + '</span><span class="t"><b>' + esc(n.modality || 'Session') + ', ' + n.duration + ' min</b> ' + esc(first) + '</span><span class="p">' + pain + '</span></a></li>';
      }).join('') + '</ul>';
    } else {
      h += '<div class="empty"><h2>No visits yet</h2><p>Start a SOAP note after your first session with ' + esc(c.name.split(' ')[0]) + '.</p><button class="btn" data-action="new-note" data-id="' + id + '">New SOAP note</button></div>';
    }
    view.innerHTML = h;
  }

  function seg(field, values, current, labels, cls) {
    return '<div class="seg' + (cls ? ' ' + cls : '') + '" role="group" data-seg="' + field + '">' + values.map(function (v, i) {
      return '<button type="button" data-value="' + v + '" aria-pressed="' + (current === v) + '">' + esc(labels ? labels[i] : v) + '</button>';
    }).join('') + '</div>';
  }

  var chart = null;
  function renderNote(id) {
    var n = note(id), c = client(n.clientId);
    openNoteId = id;
    var prev = notesFor(c.id).filter(function (x) { return x.id !== id && x.date <= n.date && x.marks && x.marks.length; })[0];
    var zeroTen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    var h = '<a class="back" href="#/client/' + c.id + '">← ' + esc(c.name) + '</a>';
    h += '<div class="page-head"><div><h1>SOAP note</h1><p class="sub">' + esc(c.name) + (n.example ? ' · <span class="tag">Example</span>' : '') + '</p></div></div>';
    if (c.contra) h += '<div class="caution"><span class="label">Precautions</span>' + esc(c.contra) + '</div>';
    h += '<div class="sheet">';
    h += '<div class="sheet-head">' +
      '<label class="field wide"><span class="label">Date</span><input type="date" data-field="date" id="nf-date" value="' + esc(n.date) + '"></label>' +
      '<label class="field"><span class="label">Length</span><select data-field="duration" id="nf-duration">' + DURATIONS.map(function (d) { return '<option value="' + d + '"' + (n.duration === d ? ' selected' : '') + '>' + d + ' min</option>'; }).join('') + '</select></label>' +
      '<label class="field"><span class="label">Modality</span><select data-field="modality" id="nf-modality">' + MODALITIES.map(function (m) { return '<option' + (n.modality === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label></div>';
    h += '<div class="scales">' +
      '<div class="scale"><div class="scale-top"><b>Pain before</b><span>0 none · 10 worst</span></div>' + seg('painBefore', zeroTen, n.painBefore) + '</div>' +
      '<div class="scale"><div class="scale-top"><b>Pain after</b><span>0 none · 10 worst</span></div>' + seg('painAfter', zeroTen, n.painAfter) + '</div>' +
      '<div class="scale"><div class="scale-top"><b>Pressure</b><span>1 light · 5 deep</span></div>' + seg('pressure', [1, 2, 3, 4, 5], n.pressure, PRESSURE, 'words') + '</div></div>';
    h += '<div class="soap">' + SOAP.map(function (s) {
      return '<div class="soap-sec"><span class="k" aria-hidden="true">' + s.letter + '</span><div class="body"><span>' + s.title + '<small>' + s.help + '</small></span>' +
        '<textarea id="nf-' + s.k + '" data-field="' + s.k + '" aria-label="' + s.title + '" rows="3">' + esc(n[s.k]) + '</textarea>' +
        '<div class="chips" aria-label="Quick phrases for ' + s.title + '">' + s.chips.map(function (t) { return '<button type="button" data-chip="' + s.k + '">' + esc(t) + '</button>'; }).join('') + '</div></div></div>';
    }).join('') + '</div>';
    h += '<div class="chart-sec"><div class="chart-tools"><b>Body chart</b><div class="legend" role="group" aria-label="Mark type" id="legend"></div></div>' +
      '<div id="chart"></div><p class="hint">Tap the figure to add a mark, tap a mark to remove it. On the anterior view, the client\'s left is on your right.</p>' +
      '<ul class="marks" id="marks"></ul>' +
      (prev && !(n.marks && n.marks.length) ? '<div><button class="btn small quiet" data-action="copy-marks" data-from="' + prev.id + '">Copy marks from ' + fmtDate(prev.date, true) + '</button></div>' : '') +
      '</div></div>';
    h += '<div class="actions"><div class="row"><a class="btn" href="#/client/' + c.id + '">Done</a><a class="btn quiet" href="#/note/' + id + '/print">Print or save PDF</a></div>' +
      '<button class="btn small danger" data-action="delete-note" data-id="' + id + '">Delete note</button></div>';
    view.innerHTML = h;

    chart = BodyChart.create(document.getElementById('chart'), { marks: n.marks || [], type: 'pain', onChange: function (marks) { n.marks = marks; touch(n); renderMarks(n); } });
    var legend = document.getElementById('legend');
    Object.keys(BodyChart.TYPES).forEach(function (t, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.innerHTML = BodyChart.glyphSVG(t) + BodyChart.TYPES[t].label.split(' /')[0];
      b.addEventListener('click', function () {
        legend.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); chart.setType(t);
      });
      legend.appendChild(b);
    });
    renderMarks(n);
    view.querySelectorAll('textarea').forEach(autosize);
  }

  function renderMarks(n) {
    var ul = document.getElementById('marks');
    if (!ul) return;
    var marks = n.marks || [];
    ul.innerHTML = marks.length ? marks.map(function (m) {
      return '<li>' + BodyChart.glyphSVG(m.type) + '<span>' + esc(BodyChart.TYPES[m.type].label.split(' /')[0]) + ': ' + esc(m.region) + '</span><button type="button" data-action="remove-mark" data-id="' + m.id + '" aria-label="Remove ' + esc(m.region) + '">×</button></li>';
    }).join('') : '<li style="color:var(--ink-2)">No marks yet.</li>';
  }

  function touch(n) { n.updatedAt = Date.now(); saveSoon(); }

  function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(84, t.scrollHeight + 2) + 'px'; }

  /* ---------- printable chart ---------- */
  function paper(n) {
    var c = client(n.clientId), st = db.settings;
    var who = [st.business, [st.therapist, st.credential].filter(Boolean).join(', ')].filter(Boolean);
    var painText = (n.painBefore == null && n.painAfter == null) ? 'Not recorded'
      : (n.painBefore != null ? n.painBefore : '?') + ' → ' + (n.painAfter != null ? n.painAfter : '?') + ' out of 10';
    var meta = [['Client', c.name], ['Date', fmtDate(n.date)], ['Session', n.duration + ' min · ' + (n.modality || '') + (n.pressure ? ' · ' + PRESSURE[n.pressure - 1].toLowerCase() + ' pressure' : '')],
      ['Pain before → after', painText]];
    var h = '<article class="paper"><div class="ph"><div><span class="label" style="color:#555">SOAP note</span><h2>' + esc(c.name) + '</h2></div><div class="who">' + (who.length ? who.map(esc).join('<br>') : '<span class="no-print">Add your name and license number under Export</span>') + '</div></div>';
    h += '<div class="meta">' + meta.map(function (m) { return '<div><span class="label">' + m[0] + '</span><b>' + esc(m[1]) + '</b></div>'; }).join('') + '</div>';
    if (c.contra) h += '<div class="pcaution"><b>Precautions:</b> ' + esc(c.contra) + '</div>';
    h += '<div class="psoap">' + SOAP.map(function (s) { return '<div><b>' + s.letter + '</b><p>' + esc(n[s.k]) + '</p></div>'; }).join('') + '</div>';
    h += '<div class="pchart"><div class="pc" data-note="' + n.id + '"></div><ul class="pmarks">' + ((n.marks || []).length ? n.marks.map(function (m) { return '<li>' + BodyChart.glyphSVG(m.type) + esc(BodyChart.TYPES[m.type].label.split(' /')[0]) + ': ' + esc(m.region) + '</li>'; }).join('') : '<li>No marks recorded.</li>') + '</ul></div>';
    h += '<div class="sign"><div>Therapist signature</div><div>Date</div></div></article>';
    return h;
  }
  function mountPaperCharts() {
    view.querySelectorAll('.pc').forEach(function (el) {
      var n = note(el.getAttribute('data-note'));
      BodyChart.create(el, { marks: n.marks || [], readOnly: true, small: true });
    });
  }
  function printTools(back, label) {
    return '<div class="print-tools"><a class="back" href="' + back + '">← ' + esc(label) + '</a><button class="btn" data-action="print">Print or save as PDF</button></div>' +
      '<p class="hint no-print">In the print window, choose “Save as PDF” to keep a file. On iPhone, tap Share, then Print, then Share again to save the PDF.</p>';
  }
  function renderPrintNote(id) {
    var n = note(id), c = client(n.clientId);
    document.title = slug(c.name) + '-' + n.date;
    view.innerHTML = printTools('#/note/' + id, 'Back to note') + paper(n);
    mountPaperCharts();
  }
  function renderPrintClient(id) {
    var c = client(id), ns = notesFor(id);
    document.title = slug(c.name) + '-all-visits';
    view.innerHTML = printTools('#/client/' + id, c.name) + ns.map(paper).join('');
    mountPaperCharts();
  }

  /* ---------- data & export ---------- */
  function renderData() {
    var st = db.settings, real = realNotes().length;
    var h = '<a class="back" href="#/">← Clients</a><div class="page-head"><div><h1>Export &amp; backup</h1><p class="sub">Your records, in files you keep.</p></div></div>';
    h += '<section class="panel"><h2>Where your notes are</h2><p>Saved in this browser on this device. Nothing is sent to a server. Clearing browser data or switching phones removes them, so keep a backup file.</p>' +
      '<div class="stat">' + plural(db.clients.length, 'client') + ' · ' + plural(db.notes.length, 'note') + (real !== db.notes.length ? ' (' + (db.notes.length - real) + ' example)' : '') + ' · last backup: ' + (st.lastBackupAt ? fmtDate(isoDay(new Date(st.lastBackupAt))) : 'never') + '</div></section>';
    h += '<section class="panel"><h2>Download</h2>' +
      '<div class="row"><button class="btn" data-action="backup">Full backup (.json)</button><button class="btn quiet" data-action="csv">All notes as spreadsheet (.csv)</button></div>' +
      '<p>The backup file restores everything on another device. The spreadsheet opens in Excel, Numbers or Google Sheets. For a PDF of one visit, open the note and choose “Print or save PDF”.</p></section>';
    h += '<section class="panel"><h2>Your details on printed notes</h2><div class="form" style="padding:0;border:0">' +
      '<label class="field"><span>Your name</span><input type="text" id="st-therapist" data-setting="therapist" value="' + esc(st.therapist) + '" placeholder="e.g. Sam Rivera"></label>' +
      '<div class="grid2"><label class="field"><span>License or credential</span><input type="text" id="st-credential" data-setting="credential" value="' + esc(st.credential) + '" placeholder="e.g. LMT #MA12345"></label>' +
      '<label class="field"><span>Practice name</span><input type="text" id="st-business" data-setting="business" value="' + esc(st.business) + '" placeholder="e.g. Rivera Bodywork"></label></div></div></section>';
    h += '<section class="panel"><h2>Restore from a backup</h2><p>Replaces the notes on this device with the ones in a Tablenote backup file.</p>' +
      '<div class="row"><span class="btn quiet file-btn">Choose backup file<input type="file" id="restore-file" accept=".json,application/json"></span></div>' +
      (ui.pendingRestore ? '<div class="notice warn"><p>Replace ' + plural(db.clients.length, 'client') + ' and ' + plural(db.notes.length, 'note') + ' on this device with ' + plural(ui.pendingRestore.clients.length, 'client') + ' and ' + plural(ui.pendingRestore.notes.length, 'note') + ' from the file?</p><div class="row"><button class="btn small" data-action="restore-confirm">Replace data</button><button class="btn small quiet" data-action="restore-cancel">Keep current data</button></div></div>' : '') +
      '<p class="hint" id="restore-msg" role="status"></p></section>';
    h += '<section class="panel"><h2>Delete everything</h2><p>Removes all clients and notes from this device. Download a backup first if you might need them.</p><div><button class="btn small danger" data-action="wipe">Delete all data</button></div></section>';
    h += '<p class="hint"><a href="../privacy.html">Privacy Policy</a> · <a href="../terms.html">Terms of Use</a></p>';
    view.innerHTML = h;
  }

  function download(name, mime, text) {
    var blob = new Blob([text], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function backup() {
    db.settings.lastBackupAt = Date.now();
    var payload = { app: 'tablenote', version: 1, exportedAt: new Date().toISOString(), clients: db.clients, notes: db.notes, settings: db.settings };
    download('tablenote-backup-' + today() + '.json', 'application/json', JSON.stringify(payload, null, 2));
    save();
  }
  function csvCell(v) { v = v == null ? '' : String(v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCSV() {
    var head = ['client', 'date', 'duration_min', 'modality', 'pressure_1to5', 'pain_before', 'pain_after', 'subjective', 'objective', 'assessment', 'plan', 'body_marks', 'precautions'];
    var rows = db.notes.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (n) {
      var c = client(n.clientId) || {};
      return [c.name, n.date, n.duration, n.modality, n.pressure, n.painBefore, n.painAfter, n.s, n.o, n.a, n.p, BodyChart.describe(n.marks), c.contra];
    });
    var text = '﻿' + [head].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    download('tablenote-notes-' + today() + '.csv', 'text/csv;charset=utf-8', text);
  }

  /* ---------- events ---------- */
  var armed = {};
  function confirmTwice(btn, key, label) {
    if (armed[key]) { clearTimeout(armed[key]); armed[key] = null; return true; }
    var original = btn.textContent;
    btn.textContent = label;
    armed[key] = setTimeout(function () { armed[key] = null; if (btn.isConnected) btn.textContent = original; }, 4000);
    return false;
  }

  view.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-chip]');
    if (chip) {
      var t = document.getElementById('nf-' + chip.getAttribute('data-chip'));
      var v = t.value.replace(/\s+$/, '');
      t.value = v ? v + (/[.;:!?]$/.test(v) ? ' ' : '; ') + chip.textContent : chip.textContent;
      t.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    var sb = e.target.closest('[data-seg] button');
    if (sb) {
      var group = sb.parentNode, field = group.getAttribute('data-seg'), n = note(openNoteId);
      var val = +sb.getAttribute('data-value');
      n[field] = n[field] === val ? null : val;
      group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-value') === n[field])); });
      touch(n);
      return;
    }
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.getAttribute('data-action'), id = a.getAttribute('data-id');
    if (act === 'remove-examples') {
      var ex = db.clients.filter(function (c) { return c.example; }).map(function (c) { return c.id; });
      db.clients = db.clients.filter(function (c) { return !c.example; });
      db.notes = db.notes.filter(function (n) { return ex.indexOf(n.clientId) < 0; });
      save(); renderList();
    } else if (act === 'new-note') {
      var last = notesFor(id)[0];
      var nn = { id: uid(), clientId: id, date: today(), duration: last ? last.duration : 60, modality: last ? last.modality : 'Swedish', pressure: last ? last.pressure : null,
        painBefore: null, painAfter: null, s: '', o: '', a: '', p: '', marks: [], createdAt: Date.now(), updatedAt: Date.now() };
      db.notes.push(nn); save();
      location.hash = '#/note/' + nn.id;
    } else if (act === 'edit-client') {
      ui.editingClient = true; renderClient(parse()[1]);
    } else if (act === 'delete-client') {
      if (!confirmTwice(a, 'dc', 'Tap again to delete client and visits')) return;
      db.clients = db.clients.filter(function (c) { return c.id !== id; });
      db.notes = db.notes.filter(function (n) { return n.clientId !== id; });
      save(); location.hash = '#/';
    } else if (act === 'delete-note') {
      if (!confirmTwice(a, 'dn', 'Tap again to delete')) return;
      var dn = note(id); db.notes = db.notes.filter(function (n) { return n.id !== id; });
      openNoteId = null; save(); location.hash = '#/client/' + dn.clientId;
    } else if (act === 'remove-mark') {
      var n2 = note(openNoteId);
      n2.marks = n2.marks.filter(function (m) { return m.id !== id; });
      chart.setMarks(n2.marks); renderMarks(n2); touch(n2);
    } else if (act === 'copy-marks') {
      var from = note(a.getAttribute('data-from')), n3 = note(openNoteId);
      n3.marks = from.marks.map(function (m) { return Object.assign({}, m, { id: uid() }); });
      chart.setMarks(n3.marks); renderMarks(n3); touch(n3); a.parentNode.remove();
    } else if (act === 'print') {
      window.print();
    } else if (act === 'backup') {
      backup(); if (parse()[0] === 'data') renderData(); else renderList();
    } else if (act === 'csv') {
      exportCSV();
    } else if (act === 'restore-confirm') {
      var r = ui.pendingRestore;
      db.clients = r.clients; db.notes = r.notes; db.settings = Object.assign(blank().settings, r.settings || {}); db.seeded = true;
      ui.pendingRestore = null; save(); renderData();
      document.getElementById('restore-msg').textContent = 'Restored ' + plural(db.clients.length, 'client') + ' and ' + plural(db.notes.length, 'note') + '.';
    } else if (act === 'restore-cancel') {
      ui.pendingRestore = null; renderData();
    } else if (act === 'wipe') {
      if (!confirmTwice(a, 'wipe', 'Tap again to delete all data')) return;
      var keep = db.settings; db = blank(); db.seeded = true; db.settings.therapist = keep.therapist; db.settings.credential = keep.credential; db.settings.business = keep.business;
      save(); location.hash = '#/';
    }
  });

  view.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'search') { ui.search = t.value; var pos = t.selectionStart; renderList(); var s = document.getElementById('search'); s.focus(); s.setSelectionRange(pos, pos); return; }
    var f = t.getAttribute('data-field');
    if (f && openNoteId) {
      var n = note(openNoteId);
      n[f] = f === 'duration' ? +t.value : t.value;
      if (t.tagName === 'TEXTAREA') autosize(t);
      touch(n);
      return;
    }
    var st = t.getAttribute('data-setting');
    if (st) { db.settings[st] = t.value; saveSoon(); }
  });

  view.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id !== 'restore-file' || !t.files[0]) return;
    var reader = new FileReader();
    reader.onload = function () {
      var msg = document.getElementById('restore-msg');
      try {
        var d = JSON.parse(reader.result);
        if (d.app !== 'tablenote' || !Array.isArray(d.clients) || !Array.isArray(d.notes)) throw new Error('format');
        ui.pendingRestore = d; renderData();
      } catch (err) {
        msg.textContent = "That file isn't a Tablenote backup. Choose a file named tablenote-backup-….json.";
      }
    };
    reader.readAsText(t.files[0]);
  });

  view.addEventListener('submit', function (e) {
    if (e.target.id !== 'client-form') return;
    e.preventDefault();
    var el = e.target.elements;
    var name = el.namedItem('name').value.trim();
    if (!name) { document.getElementById('cf-error').hidden = false; el.namedItem('name').focus(); return; }
    var val = function (k) { return el.namedItem(k).value.trim(); };
    var data = { name: name, phone: val('phone'), email: val('email'), history: val('history'), contra: val('contra') };
    var parts = parse();
    if (parts[1] === 'new') {
      var c = Object.assign({ id: uid(), createdAt: Date.now() }, data);
      db.clients.push(c); save(); location.hash = '#/client/' + c.id;
    } else {
      Object.assign(client(parts[1]), data); ui.editingClient = false; save(); renderClient(parts[1]);
    }
  });

  window.addEventListener('pagehide', function () { clearTimeout(saveTimer); save(); });

  if (!storageOK) showSave();
  route();
})();
