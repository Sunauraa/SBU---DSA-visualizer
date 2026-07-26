/* ============================================================
   core.js — shared helpers + the frame-based animation player
   Every visualizer works the same way:
     1. an algorithm runs to completion and records "frames"
     2. the Player scrubs through those frames
     3. a render(frame) callback paints the current frame
   Recording up-front (instead of animating live) means you get
   step-back, scrubbing and instant replay for free.
   ============================================================ */
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const DSA = (window.DSA = {});

  /* ---------------- tiny DOM helpers ---------------- */
  DSA.$ = (sel, root) => (root || document).querySelector(sel);
  DSA.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  DSA.el = function (tag, attrs, children) {
    const n = document.createElement(tag);
    for (const k in attrs || {}) {
      if (k === "class") n.className = attrs[k];
      else if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => n.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return n;
  };

  DSA.svg = function (tag, attrs, children) {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    (children || []).forEach((c) => n.appendChild(c));
    return n;
  };

  /* svg convenience shapes */
  DSA.sText = (x, y, s, attrs) =>
    DSA.svg("text", Object.assign({ x, y, "text-anchor": "middle", "dominant-baseline": "central", "font-size": 13 }, attrs || {}), [
      document.createTextNode(String(s)),
    ]);
  DSA.sLine = (x1, y1, x2, y2, cls) => DSA.svg("line", { x1, y1, x2, y2, class: cls || "edge" });

  /* ---------------- misc utils ---------------- */
  DSA.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  DSA.randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  DSA.shuffled = function (a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  DSA.randArray = (n, lo, hi) => Array.from({ length: n }, () => DSA.randInt(lo == null ? 5 : lo, hi == null ? 99 : hi));

  /** Parse "3, 9 12,-4" into a number array. Returns [] on empty. */
  DSA.parseNums = function (s) {
    return String(s || "")
      .split(/[\s,;]+/)
      .filter((t) => t.length && /^-?\d+(\.\d+)?$/.test(t))
      .map(Number);
  };
  DSA.parseTokens = function (s) {
    return String(s || "").split(/[\s,;]+/).filter((t) => t.length);
  };

  let toastEl = null, toastT = 0;
  DSA.toast = function (msg, isErr) {
    if (!toastEl) {
      toastEl = DSA.el("div", { class: "toast" });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(toastT);
    toastT = setTimeout(() => (toastEl.className = "toast"), 2200);
  };

  /* ---------------- legend ---------------- */
  DSA.legend = function (mount, items) {
    const m = typeof mount === "string" ? DSA.$(mount) : mount;
    if (!m) return;
    m.className = "legend";
    m.innerHTML = items
      .map((it) => `<span><i style="background:${it.color}"></i>${it.label}</span>`)
      .join("");
  };

  /* ============================================================
     code panels
     ------------------------------------------------------------
     Lines are written as PLAIN TEXT (no HTML) and highlighted here,
     so the same string is safe in every language.
     ============================================================ */
  const KEYWORDS = {
    java:
      "abstract boolean break case catch char class continue default do double else extends final finally " +
      "float for if implements import instanceof int interface long new null private protected public return " +
      "static super switch this throw throws true false try void while",
    cpp:
      "auto bool break case catch class const constexpr continue default delete do double else enum false " +
      "float for if inline int long namespace new nullptr private protected public return short signed sizeof " +
      "static struct swap switch template this throw true try typedef typename unsigned using vector void while",
    python:
      "and as assert break class continue def del elif else except False finally for from global if import " +
      "in is lambda None nonlocal not or pass raise return True try while with yield",
  };
  const KW_RE = {};
  for (const k in KEYWORDS) KW_RE[k] = new RegExp("^(?:" + KEYWORDS[k].split(" ").join("|") + ")$");

  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /** Colourise one plain-text line for `lang`. Pseudocode only gets comments. */
  function paint(line, lang) {
    if (line === "") return "&nbsp;";
    const cmt = lang === "python" ? "#" : "//";
    const kw = KW_RE[lang];
    let out = "", rest = line;

    /* trailing comment first — everything after it is literal */
    const ci = rest.indexOf(cmt);
    let tail = "";
    if (ci >= 0) { tail = '<span class="cm">' + esc(rest.slice(ci)) + "</span>"; rest = rest.slice(0, ci); }
    if (!kw) return esc(rest) + tail;

    /* strings, numbers, keywords */
    const tok = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_]\w*)/g;
    let last = 0, m;
    while ((m = tok.exec(rest))) {
      out += esc(rest.slice(last, m.index));
      if (m[1]) out += '<span class="st">' + esc(m[1]) + "</span>";
      else if (m[2]) out += '<span class="nm">' + m[2] + "</span>";
      else if (kw.test(m[3])) out += '<span class="kw">' + m[3] + "</span>";
      else out += m[3];
      last = m.index + m[0].length;
    }
    return out + esc(rest.slice(last)) + tail;
  }

  /* which language the whole site is showing, remembered between pages */
  const LANGS = [
    { id: "pseudo", label: "Pseudocode" },
    { id: "java", label: "Java" },
    { id: "cpp", label: "C++" },
    { id: "python", label: "Python" },
  ];
  const LS_KEY = "dsa.lang";
  let curLang = "pseudo";
  try { const s = localStorage.getItem(LS_KEY); if (s && LANGS.some((l) => l.id === s)) curLang = s; } catch (e) {}
  DSA.lang = () => curLang;

  let blocks = [];
  function setLang(id) {
    if (id === curLang) return;
    curLang = id;
    try { localStorage.setItem(LS_KEY, id); } catch (e) {}
    /* panels are rebuilt whenever you pick a new algorithm — drop the detached ones */
    blocks = blocks.filter((b) => b.node.isConnected);
    blocks.forEach((b) => b.refresh());
  }

  /** Plain single-language panel: CodePanel(mount, ["line", ...]). */
  DSA.CodePanel = function (mount, lines) {
    return DSA.CodeBlock(mount, { pseudo: lines });
  };

  /* ------------------------------------------------------------
     CodeBlock(mount, variants)
       variants = { pseudo: [...], java: [...], cpp: [...], python: [...],
                    map: { java: [...], ... } }
     `map[lang][i]` is the line of that language's listing matching
     pseudocode line i, so a frame recorded against the pseudocode
     highlights the right line whatever is on screen. Identity if absent.
     ------------------------------------------------------------ */
  DSA.CodeBlock = function (mount, variants, opts) {
    const o = opts || {};
    const m = typeof mount === "string" ? DSA.$(mount) : mount;
    const maps = variants.map || {};
    const have = LANGS.filter((l) => Array.isArray(variants[l.id]) && variants[l.id].length);
    const pre = DSA.el("pre", { class: "code" });
    let spans = [], line = null, bar = null;

    /* `switcher: false` for a second block that follows the panel's own switch */
    if (have.length > 1 && o.switcher !== false) {
      bar = DSA.el("div", { class: "lang-switch" });
      bar.appendChild(DSA.el("span", { class: "lang-label", text: "language" }));
      have.forEach((l) =>
        bar.appendChild(DSA.el("button", { text: l.label, "data-lang": l.id, onclick: () => setLang(l.id) }))
      );
    }
    if (m) {
      m.innerHTML = "";
      if (bar) m.appendChild(bar);
      m.appendChild(pre);
    }

    const api = {
      node: pre,
      /** Repaint in the current language, keeping the highlighted step. */
      refresh() {
        const lang = variants[curLang] ? curLang : have.length ? have[0].id : "pseudo";
        pre.innerHTML = "";
        spans = (variants[lang] || []).map((t) => {
          const s = DSA.el("span", { class: "ln", html: paint(t, lang) });
          pre.appendChild(s);
          return s;
        });
        if (bar) DSA.$$("button", bar).forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
        pre.dataset.lang = lang;
        if (line != null) api.highlight(line);
      },
      /** i is always an index into the PSEUDOCODE listing. */
      highlight(i) {
        line = i;
        const lang = pre.dataset.lang;
        const map = maps[lang];
        const k = map && map[i] != null ? map[i] : i;
        spans.forEach((s, j) => s.classList.toggle("on", j === k));
        const on = spans[k];
        if (on && pre.scrollHeight > pre.clientHeight) {
          const top = on.offsetTop - pre.offsetTop;
          if (top < pre.scrollTop || top > pre.scrollTop + pre.clientHeight - 30)
            pre.scrollTop = Math.max(0, top - pre.clientHeight / 2);
        }
      },
    };
    blocks.push(api);
    api.refresh();
    return api;
  };

  /* ---------------- tab strip ---------------- */
  DSA.Tabs = function (mount, items, onChange) {
    const m = typeof mount === "string" ? DSA.$(mount) : mount;
    m.className = "tabs";
    m.innerHTML = "";
    const btns = items.map((it, i) =>
      DSA.el("button", {
        text: it.label,
        onclick: () => pick(i),
      })
    );
    btns.forEach((b) => m.appendChild(b));
    let cur = -1;
    function pick(i) {
      if (i === cur) return;
      cur = i;
      btns.forEach((b, k) => b.classList.toggle("active", k === i));
      onChange(items[i].id, i);
    }
    pick(0);
    return { pick, get current() { return items[cur] && items[cur].id; } };
  };

  /* ============================================================
     Player — scrubs a recorded frame list
     opts: { mount, render(frame, index, frames), delay }
     Frame is any object; by convention `frame.note` is the caption.
     ============================================================ */
  const players = [];

  DSA.Player = function Player(opts) {
    const self = this;
    this.frames = [{ note: "Press an operation button to begin." }];
    this.index = 0;
    this.playing = false;
    this.speed = 1;
    this.baseDelay = opts.delay || 620;
    this.render = opts.render || function () {};
    this.onFrame = opts.onFrame || null;
    const mount = typeof opts.mount === "string" ? DSA.$(opts.mount) : opts.mount;
    this.mount = mount;

    mount.classList.add("player");
    mount.innerHTML =
      '<div class="player-row">' +
      '<button class="icon" data-a="first" title="First frame">&#124;&#9664;</button>' +
      '<button class="icon" data-a="prev" title="Step back (&larr;)">&#9664;</button>' +
      '<button class="primary" data-a="play" style="min-width:6.2rem" title="Play / pause (space)">&#9654; Play</button>' +
      '<button class="icon" data-a="next" title="Step forward (&rarr;)">&#9654;</button>' +
      '<button class="icon" data-a="last" title="Last frame">&#9654;&#124;</button>' +
      '<div class="sep"></div>' +
      '<div class="field"><label>Speed</label><select data-a="speed">' +
      '<option value="0.35">0.35&times;</option><option value="0.6">0.6&times;</option>' +
      '<option value="1" selected>1&times;</option><option value="2">2&times;</option>' +
      '<option value="4">4&times;</option><option value="8">8&times;</option></select></div>' +
      '<div class="spacer" style="flex:1"></div>' +
      '<div class="counter" data-a="counter">0 / 0</div>' +
      "</div>" +
      '<div class="track"><input type="range" min="0" max="0" value="0" data-a="track"></div>' +
      '<div class="note" data-a="note"></div>';

    const q = (a) => mount.querySelector('[data-a="' + a + '"]');
    const btnPlay = q("play"), track = q("track"), counter = q("counter"), note = q("note");

    mount.addEventListener("click", (e) => {
      const a = e.target.closest("button[data-a]");
      if (!a) return;
      const act = a.dataset.a;
      if (act === "play") self.toggle();
      else if (act === "next") { self.pause(); self.step(1); }
      else if (act === "prev") { self.pause(); self.step(-1); }
      else if (act === "first") { self.pause(); self.goto(0); }
      else if (act === "last") { self.pause(); self.goto(self.frames.length - 1); }
    });
    q("speed").addEventListener("change", (e) => {
      self.speed = parseFloat(e.target.value);
      if (self.playing) self._arm();
    });
    track.addEventListener("input", (e) => { self.pause(); self.goto(parseInt(e.target.value, 10)); });

    this._sync = function () {
      const f = this.frames[this.index] || {};
      track.max = Math.max(0, this.frames.length - 1);
      track.value = this.index;
      counter.textContent = this.index + 1 + " / " + this.frames.length;
      note.innerHTML = f.note == null ? "" : f.note;
      btnPlay.innerHTML = this.playing ? "&#10073;&#10073; Pause" : "&#9654; Play";
      try { this.render(f, this.index, this.frames); } catch (err) { console.error(err); }
      if (this.onFrame) this.onFrame(f, this.index);
    };

    this.load = function (frames, autoplay) {
      setActive(this);          /* running an operation claims the keyboard too */
      this.pause();
      this.frames = frames && frames.length ? frames : [{ note: "No steps were produced." }];
      this.index = 0;
      this._sync();
      if (autoplay !== false) this.play();
      return this;
    };
    this.goto = function (i) {
      this.index = DSA.clamp(i, 0, this.frames.length - 1);
      this._sync();
    };
    this.step = function (d) { this.goto(this.index + d); };
    this.play = function () {
      if (this.frames.length < 2) return;
      if (this.index >= this.frames.length - 1) this.index = 0;
      this.playing = true;
      this._sync();
      this._arm();
    };
    this.pause = function () {
      this.playing = false;
      clearTimeout(this._t);
      if (btnPlay) btnPlay.innerHTML = "&#9654; Play";
    };
    this.toggle = function () { this.playing ? this.pause() : this.play(); };
    this._arm = function () {
      clearTimeout(this._t);
      this._t = setTimeout(() => {
        if (!this.playing) return;
        if (this.index < this.frames.length - 1) { this.index++; this._sync(); this._arm(); }
        else this.pause();
      }, Math.max(24, this.baseDelay / this.speed));
    };
    this.isVisible = function () { return !!mount.offsetParent; };
    /* the panel this player belongs to — clicking anywhere in it claims the keyboard */
    this.scope = mount.closest(".panel") || mount;

    players.push(this);
    markMulti();
    this._sync();
  };

  /* ---------------- which player owns the keyboard ---------------- */
  /* A page can host several players at once (arrays.html has one for the
     dynamic array and one for linked lists, both always on screen), so
     "the first visible one" is not good enough. Keys go to the player you
     last touched; failing that, the one nearest the middle of the viewport. */
  let activePlayer = null;

  function markMulti() {
    /* only show the "keys go here" cue when there is something to choose between */
    document.documentElement.classList.toggle("multi-player", players.length > 1);
  }

  function setActive(p) {
    if (!p || p === activePlayer) return;
    activePlayer = p;
    players.forEach((x) => x.mount.classList.toggle("is-active", x === p));
  }

  function playerAt(node) {
    return players.find((p) => p.scope.contains(node)) || null;
  }

  /* clicking a button, typing in a field, or focusing anything inside a
     panel hands that panel's player the keyboard */
  document.addEventListener("pointerdown", (e) => setActive(playerAt(e.target)), true);
  document.addEventListener("focusin", (e) => setActive(playerAt(e.target)), true);

  function nearestToViewportCentre() {
    const vis = players.filter((p) => p.isVisible());
    if (vis.length < 2) return vis[0] || null;
    const mid = window.innerHeight / 2;
    let best = null, bestD = Infinity;
    vis.forEach((p) => {
      const r = p.mount.getBoundingClientRect();
      const d = Math.abs((r.top + r.bottom) / 2 - mid);
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }

  /* keyboard: space = play/pause, arrows = step, on the active player */
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
    let p = activePlayer && activePlayer.isVisible() ? activePlayer : null;
    if (!p) p = nearestToViewportCentre();
    if (!p) return;
    if (e.code === "Space") { e.preventDefault(); setActive(p); p.toggle(); }
    else if (e.code === "ArrowRight") { e.preventDefault(); setActive(p); p.pause(); p.step(1); }
    else if (e.code === "ArrowLeft") { e.preventDefault(); setActive(p); p.pause(); p.step(-1); }
  });

  /* ============================================================
     Recorder — the thing algorithms talk to
     ============================================================ */
  DSA.Recorder = function Recorder(limit) {
    this.frames = [];
    this.limit = limit || 4000;
    this.overflow = false;
  };
  DSA.Recorder.prototype.push = function (frame) {
    if (this.frames.length >= this.limit) { this.overflow = true; return false; }
    this.frames.push(frame);
    return true;
  };

  /* ============================================================
     Layout helper: assign x/y to a binary tree by in-order index
     node: { left, right, ... }  -> writes _x, _y, _depth
     ============================================================ */
  DSA.layoutBinary = function (root, opts) {
    const o = Object.assign({ gapX: 46, gapY: 62, padX: 26, padY: 30 }, opts || {});
    let col = 0, maxD = 0;
    (function walk(n, d) {
      if (!n) return;
      walk(n.left, d + 1);
      n._x = o.padX + col++ * o.gapX;
      n._y = o.padY + d * o.gapY;
      n._depth = d;
      maxD = Math.max(maxD, d);
      walk(n.right, d + 1);
    })(root, 0);
    return { width: o.padX * 2 + Math.max(1, col) * o.gapX, height: o.padY * 2 + (maxD + 1) * o.gapY, count: col };
  };

  /* footer, injected so every page shares one */
  DSA.footer = function () {
    const f = DSA.$("footer.site");
    if (f && !f.innerHTML.trim())
      f.innerHTML =
        '<div class="wrap">Data Structure &amp; Algorithm Visualizer &middot; built for CSE 214 / CSE 373 &middot; ' +
        "keyboard: <span class=\"mono\">space</span> play/pause, <span class=\"mono\">&larr; &rarr;</span> step</div>";
  };
  document.addEventListener("DOMContentLoaded", DSA.footer);
})();
