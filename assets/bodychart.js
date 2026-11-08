/* Tablenote body chart: anterior + posterior figures, tap to mark.
   Marks: { id, view: 'front'|'back', x, y, type: 'pain'|'tension'|'avoid', region }
   Coordinates are in a 200x440 figure space so marks stay put at any size.
   Anatomical convention: on the anterior view the client's left is on the viewer's right. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var OFFSET = { front: 10, back: 230 };
  var TYPES = {
    pain: { label: 'Pain' },
    tension: { label: 'Tension / trigger point' },
    avoid: { label: 'Avoid / contraindication' }
  };

  // Words shown on the chart. Stored marks keep the English region (data); screens translate.
  // Sides: English L/R, French G/D (gauche/droite), Spanish I/D (izquierda/derecha).
  var WORDS = {
    en: { L: 'L', R: 'R', ant: 'ANTERIOR', post: 'POSTERIOR', aria: 'Body chart, anterior and posterior views',
      types: { pain: 'Pain', tension: 'Tension', avoid: 'Avoid' } },
    fr: { L: 'G', R: 'D', ant: 'ANTÉRIEUR', post: 'POSTÉRIEUR', aria: 'Schéma corporel, vues antérieure et postérieure',
      types: { pain: 'Douleur', tension: 'Tension', avoid: 'À éviter' },
      regions: { 'Head / face': 'Tête / visage', Occiput: 'Occiput', 'Anterior neck': 'Cou, face antérieure', 'Cervical spine': 'Rachis cervical',
        'posterior neck': 'nuque', deltoid: 'deltoïde', biceps: 'biceps', triceps: 'triceps', 'forearm flexors': 'fléchisseurs de l’avant-bras',
        'forearm extensors': 'extenseurs de l’avant-bras', hand: 'main', 'pectoralis major': 'grand pectoral', 'upper trapezius': 'trapèze supérieur',
        Sternum: 'Sternum', 'chest wall': 'paroi thoracique', 'Thoracic spine': 'Rachis thoracique', rhomboids: 'rhomboïdes', 'latissimus dorsi': 'grand dorsal',
        Abdomen: 'Abdomen', obliques: 'obliques', 'Lumbar spine': 'Rachis lombaire', 'erector spinae': 'érecteurs du rachis', 'quadratus lumborum': 'carré des lombes',
        'hip flexors': 'fléchisseurs de la hanche', gluteals: 'fessiers', quadriceps: 'quadriceps', hamstrings: 'ischio-jambiers', knee: 'genou',
        'popliteal fossa': 'creux poplité', 'tibialis anterior': 'tibial antérieur', 'gastrocnemius / soleus': 'gastrocnémien / soléaire',
        'foot (dorsum)': 'pied (face dorsale)', 'heel / plantar fascia': 'talon / fascia plantaire' } },
    es: { L: 'I', R: 'D', ant: 'ANTERIOR', post: 'POSTERIOR', aria: 'Diagrama corporal, vistas anterior y posterior',
      types: { pain: 'Dolor', tension: 'Tensión', avoid: 'Evitar' },
      regions: { 'Head / face': 'Cabeza / cara', Occiput: 'Región occipital', 'Anterior neck': 'Cuello anterior', 'Cervical spine': 'Columna cervical',
        'posterior neck': 'cuello posterior', deltoid: 'deltoides', biceps: 'bíceps', triceps: 'tríceps', 'forearm flexors': 'flexores del antebrazo',
        'forearm extensors': 'extensores del antebrazo', hand: 'mano', 'pectoralis major': 'pectoral mayor', 'upper trapezius': 'trapecio superior',
        Sternum: 'Esternón', 'chest wall': 'pared torácica', 'Thoracic spine': 'Columna torácica', rhomboids: 'romboides', 'latissimus dorsi': 'dorsal ancho',
        Abdomen: 'Abdomen', obliques: 'oblicuos', 'Lumbar spine': 'Columna lumbar', 'erector spinae': 'erectores de la columna', 'quadratus lumborum': 'cuadrado lumbar',
        'hip flexors': 'flexores de cadera', gluteals: 'glúteos', quadriceps: 'cuádriceps', hamstrings: 'isquiotibiales', knee: 'rodilla',
        'popliteal fossa': 'fosa poplítea', 'tibialis anterior': 'tibial anterior', 'gastrocnemius / soleus': 'gastrocnemio / sóleo',
        'foot (dorsum)': 'pie (dorso)', 'heel / plantar fascia': 'talón / fascia plantar' } }
  };
  function pageLang() { var l = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase(); return WORDS[l] ? l : 'en'; }
  function words(lang) { return WORDS[lang] || WORDS[pageLang()] || WORDS.en; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // lang defaults to the page language. Pass 'en' for the stored (data) form.
  function region(view, x, y, lang) {
    var w = words(lang), en = w === WORDS.en;
    var dx = x - 100, adx = Math.abs(dx);
    var front = view === 'front';
    var clientLeft = front ? dx > 0 : dx < 0;
    var side = clientLeft ? w.L : w.R;
    var mid = adx < 8;
    function C(name) { return en ? name : w.regions[name] || name; }
    function S(name) { return en ? side + ' ' + name : cap(C(name)) + ' ' + side; }
    if (y < 58) return C(front ? 'Head / face' : 'Occiput');
    if (y < 82) return front ? C('Anterior neck') : (mid ? C('Cervical spine') : S('posterior neck'));
    if (adx >= 40 && y < 112) return S('deltoid');
    if (adx >= 40 && y < 262) {
      if (y < 166) return S(front ? 'biceps' : 'triceps');
      if (y < 240) return S(front ? 'forearm flexors' : 'forearm extensors');
      return S('hand');
    }
    if (y < 112) return S(front ? 'pectoralis major' : 'upper trapezius');
    if (y < 160) return front ? (mid ? C('Sternum') : S('chest wall')) : (mid ? C('Thoracic spine') : adx < 26 ? S('rhomboids') : S('latissimus dorsi'));
    if (y < 205) return front ? (adx < 12 ? C('Abdomen') : S('obliques')) : (mid ? C('Lumbar spine') : adx < 22 ? S('erector spinae') : S('quadratus lumborum'));
    if (y < 238) return S(front ? 'hip flexors' : 'gluteals');
    if (y < 310) return S(front ? 'quadriceps' : 'hamstrings');
    if (y < 330) return S(front ? 'knee' : 'popliteal fossa');
    if (y < 404) return S(front ? 'tibialis anterior' : 'gastrocnemius / soleus');
    return S(front ? 'foot (dorsum)' : 'heel / plantar fascia');
  }
  // Region of a stored mark in a language: English keeps the stored text, others are worked out again from the position.
  function regionOf(m, lang) {
    if (words(lang) === WORDS.en || m.x == null || !m.view) return m.region;
    return region(m.view, m.x, m.y, lang);
  }
  function label(type, lang) { return words(lang).types[type] || WORDS.en.types[type] || type; }

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  // One silhouette, drawn twice: an outline pass underneath, then a fill pass on top,
  // so overlapping limbs and torso merge into a single clean outline.
  function shapes(pass) {
    var outline = pass === 'outline';
    var add = outline ? 3 : 0;
    var lineStyle = function (w) {
      return { fill: 'none', stroke: outline ? 'var(--tissue-line)' : 'var(--tissue)', 'stroke-width': w + add, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    };
    var solid = { fill: 'var(--tissue)', stroke: outline ? 'var(--tissue-line)' : 'none', 'stroke-width': outline ? 3 : 0 };
    var list = [];
    list.push(['circle', Object.assign({ cx: 100, cy: 34, r: 21 }, solid)]);
    list.push(['line', Object.assign({ x1: 100, y1: 50, x2: 100, y2: 84 }, lineStyle(20))]);
    list.push(['path', Object.assign({ d: 'M60,86 Q100,74 140,86 Q147,96 144,110 Q136,150 128,196 Q134,214 134,232 Q100,246 66,232 Q66,214 72,196 Q64,150 56,110 Q53,96 60,86 Z' }, solid)]);
    [[58, 96, 46, 166, 40, 238], [142, 96, 154, 166, 160, 238]].forEach(function (a) {
      list.push(['polyline', Object.assign({ points: a[0] + ',' + a[1] + ' ' + a[2] + ',' + a[3] + ' ' + a[4] + ',' + a[5] }, lineStyle(18))]);
    });
    list.push(['circle', Object.assign({ cx: 39, cy: 252, r: 10 }, solid)]);
    list.push(['circle', Object.assign({ cx: 161, cy: 252, r: 10 }, solid)]);
    [[84, 226, 82, 318, 30], [116, 226, 118, 318, 30], [82, 318, 84, 404, 22], [118, 318, 116, 404, 22]].forEach(function (a) {
      list.push(['line', Object.assign({ x1: a[0], y1: a[1], x2: a[2], y2: a[3] }, lineStyle(a[4]))]);
    });
    list.push(['ellipse', Object.assign({ cx: 82, cy: 414, rx: 12, ry: 9 }, solid)]);
    list.push(['ellipse', Object.assign({ cx: 118, cy: 414, rx: 12, ry: 9 }, solid)]);
    return list;
  }

  function figure(view) {
    var g = el('g', { transform: 'translate(' + OFFSET[view] + ',0)' });
    ['outline', 'fill'].forEach(function (pass) {
      var layer = el('g', pass === 'fill' ? { 'class': 'bc-hit', 'data-view': view } : { 'aria-hidden': 'true' });
      shapes(pass).forEach(function (s) { layer.appendChild(el(s[0], s[1])); });
      g.appendChild(layer);
    });
    var detail = el('g', { fill: 'none', stroke: 'var(--tissue-line)', 'stroke-width': 1.2, 'stroke-linecap': 'round', 'pointer-events': 'none', opacity: 0.8 });
    if (view === 'front') {
      detail.appendChild(el('path', { d: 'M72,90 Q85,95 97,91 M128,90 Q115,95 103,91' }));
      detail.appendChild(el('circle', { cx: 100, cy: 186, r: 1.6, fill: 'var(--tissue-line)' }));
    } else {
      detail.appendChild(el('path', { d: 'M100,84 L100,224', 'stroke-dasharray': '3 4' }));
      detail.appendChild(el('path', { d: 'M76,104 Q82,126 92,132 M124,104 Q118,126 108,132' }));
    }
    g.appendChild(detail);
    var txt = { 'font-family': 'IBM Plex Mono, ui-monospace, monospace', 'font-size': 11, fill: 'var(--ink-2)', 'pointer-events': 'none', 'letter-spacing': '1' };
    var t = el('text', Object.assign({ x: 100, y: 450, 'text-anchor': 'middle' }, txt));
    var w = words();
    t.textContent = view === 'front' ? w.ant : w.post;
    g.appendChild(t);
    var leftSide = view === 'front' ? w.R : w.L, rightSide = view === 'front' ? w.L : w.R;
    var a = el('text', Object.assign({ x: 8, y: 70 }, txt)); a.textContent = leftSide; g.appendChild(a);
    var b = el('text', Object.assign({ x: 186, y: 70 }, txt)); b.textContent = rightSide; g.appendChild(b);
    return g;
  }

  function markGlyph(m, small) {
    var g = el('g', { transform: 'translate(' + (OFFSET[m.view] + m.x) + ',' + m.y + ')', 'data-mark': m.id, 'class': 'bc-mark' });
    var r = small ? 5 : 7;
    g.appendChild(el('circle', { r: r + 6, fill: 'transparent' }));
    if (m.type === 'pain') {
      g.appendChild(el('circle', { r: r, fill: 'var(--pain)', stroke: 'var(--surface)', 'stroke-width': 2 }));
    } else if (m.type === 'tension') {
      g.appendChild(el('path', { d: 'M-' + r + ',-' + r + ' L' + r + ',' + r + ' M' + r + ',-' + r + ' L-' + r + ',' + r, stroke: 'var(--tension)', 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none' }));
    } else {
      g.appendChild(el('circle', { r: r, fill: 'none', stroke: 'var(--avoid)', 'stroke-width': 2.5 }));
      g.appendChild(el('path', { d: 'M-' + (r - 2) + ',' + (r - 2) + ' L' + (r - 2) + ',-' + (r - 2), stroke: 'var(--avoid)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    }
    return g;
  }

  // Small standalone glyph for legends and mark lists
  function glyphSVG(type) {
    var s = '<svg viewBox="-9 -9 18 18" aria-hidden="true">';
    if (type === 'pain') s += '<circle r="6" fill="var(--pain)"/>';
    else if (type === 'tension') s += '<path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="var(--tension)" stroke-width="3" stroke-linecap="round"/>';
    else s += '<circle r="6" fill="none" stroke="var(--avoid)" stroke-width="2.2"/><path d="M-4,4 L4,-4" stroke="var(--avoid)" stroke-width="2.2" stroke-linecap="round"/>';
    return s + '</svg>';
  }

  function uid() { return Math.random().toString(36).slice(2, 10); }

  function create(container, opts) {
    opts = opts || {};
    var state = { marks: (opts.marks || []).slice(), type: opts.type || 'pain', readOnly: !!opts.readOnly };
    var svg = el('svg', { viewBox: '0 0 440 462', role: 'img', 'class': 'bodychart' });
    svg.setAttribute('aria-label', opts.label || words().aria);
    svg.appendChild(figure('front'));
    svg.appendChild(figure('back'));
    var markLayer = el('g', {});
    svg.appendChild(markLayer);
    container.appendChild(svg);

    function render() {
      while (markLayer.firstChild) markLayer.removeChild(markLayer.firstChild);
      state.marks.forEach(function (m) { markLayer.appendChild(markGlyph(m, opts.small)); });
    }

    function toLocal(evt) {
      var pt = svg.createSVGPoint();
      pt.x = evt.clientX; pt.y = evt.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }

    svg.addEventListener('click', function (evt) {
      if (state.readOnly) return;
      var markEl = evt.target.closest('[data-mark]');
      if (markEl) {
        var id = markEl.getAttribute('data-mark');
        state.marks = state.marks.filter(function (m) { return m.id !== id; });
        render(); if (opts.onChange) opts.onChange(state.marks.slice());
        return;
      }
      var hit = evt.target.closest('.bc-hit');
      if (!hit) return;
      var view = hit.getAttribute('data-view');
      var p = toLocal(evt);
      var x = Math.round(p.x - OFFSET[view]), y = Math.round(p.y);
      var m = { id: uid(), view: view, x: x, y: y, type: state.type, region: region(view, x, y, 'en') };
      state.marks.push(m);
      render(); if (opts.onChange) opts.onChange(state.marks.slice());
    });

    render();
    return {
      setType: function (t) { state.type = t; },
      setMarks: function (marks) { state.marks = (marks || []).slice(); render(); },
      getMarks: function () { return state.marks.slice(); },
      svg: svg
    };
  }

  // describe(marks, 'en') is the data form used in the CSV export.
  function describe(marks, lang) {
    var sep = words(lang) === WORDS.fr ? ' : ' : ': ';
    return (marks || []).map(function (m) { return label(m.type, lang).toLowerCase() + sep + regionOf(m, lang); }).join('; ');
  }

  window.BodyChart = { create: create, region: region, regionOf: regionOf, label: label, glyphSVG: glyphSVG, TYPES: TYPES, describe: describe };
})();
