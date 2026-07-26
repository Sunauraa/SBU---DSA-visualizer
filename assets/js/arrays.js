/* ============================================================
   arrays.js — dynamic array (ArrayList) + singly / doubly linked lists
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);

  /* =======================================================
     PART 1 — Dynamic array
     ======================================================= */
  const DA = {
    cap: 4,
    data: new Array(4).fill(null),
    size: 0,
    copies: 0,
    grows: 0,
  };

  function daFrames(build) {
    const R = new D.Recorder(1500);
    const s = {
      snap(marks, note, extra) {
        R.push(
          Object.assign(
            {
              cells: DA.data.slice(),
              size: DA.size,
              cap: DA.cap,
              marks: marks || {},
              note: note,
              copies: DA.copies,
              grows: DA.grows,
            },
            extra || {}
          )
        );
      },
    };
    build(s);
    return R.frames;
  }

  function daGrow(s) {
    const old = DA.data.slice();
    const nc = Math.max(1, DA.cap * 2);
    s.snap({}, "Array is <b>full</b> (size " + DA.size + " = capacity " + DA.cap + "). Allocate a new array of capacity <b>" + nc + "</b>.");
    const fresh = new Array(nc).fill(null);
    DA.cap = nc;
    DA.data = fresh;
    DA.grows++;
    s.snap({}, "New backing array allocated. Now copy the " + old.filter((x) => x !== null).length + " existing elements across — this is the expensive part.", {
      src: { arr: old, marks: {} },
    });
    for (let i = 0; i < DA.size; i++) {
      DA.data[i] = old[i];
      DA.copies++;
      s.snap({ [i]: "swap" }, "Copy element " + old[i] + " from old[" + i + "] to new[" + i + "].", {
        src: { arr: old, marks: { [i]: "cmp" } },
      });
    }
    s.snap({}, "Copy finished. The old array is garbage now. Capacity doubled, so this only happens on the 1st, 2nd, 4th, 8th … insert — that is why <b>add is O(1) amortised</b> even though one call can cost O(n).");
  }

  const daOps = {
    add(v) {
      return daFrames((s) => {
        s.snap({}, "<b>add(" + v + ")</b> — append at the end. size = " + DA.size + ", capacity = " + DA.cap + ".");
        if (DA.size === DA.cap) daGrow(s);
        DA.data[DA.size] = v;
        DA.size++;
        s.snap({ [DA.size - 1]: "done" }, "Write " + v + " into slot " + (DA.size - 1) + " and bump size to " + DA.size + ". <b>O(1)</b>.");
      });
    },
    insert(i, v) {
      return daFrames((s) => {
        s.snap({ [i]: "target" }, "<b>insert(" + i + ", " + v + ")</b> — everything from index " + i + " on must slide right.");
        if (DA.size === DA.cap) daGrow(s);
        for (let k = DA.size - 1; k >= i; k--) {
          DA.data[k + 1] = DA.data[k];
          s.snap({ [k + 1]: "swap", [k]: "cmp" }, "Shift A[" + k + "] = " + DA.data[k] + " right into slot " + (k + 1) + ".");
        }
        DA.data[i] = v;
        DA.size++;
        s.snap({ [i]: "done" }, "Drop " + v + " into the gap at index " + i + ". Shifting makes insert <b>O(n)</b>.");
      });
    },
    removeAt(i) {
      return daFrames((s) => {
        const v = DA.data[i];
        s.snap({ [i]: "swap" }, "<b>remove(" + i + ")</b> — A[" + i + "] = " + v + " goes away and the tail slides left.");
        for (let k = i; k < DA.size - 1; k++) {
          DA.data[k] = DA.data[k + 1];
          s.snap({ [k]: "swap", [k + 1]: "cmp" }, "Shift A[" + (k + 1) + "] = " + DA.data[k] + " left into slot " + k + ".");
        }
        DA.data[DA.size - 1] = null;
        DA.size--;
        s.snap({}, "Null out the old last slot and drop size to " + DA.size + ". Capacity stays " + DA.cap + " — removing does not shrink the array. <b>O(n)</b>.");
      });
    },
    get(i) {
      return daFrames((s) => {
        s.snap({}, "<b>get(" + i + ")</b> — the address is base + " + i + "·elementSize, computed with arithmetic.");
        s.snap({ [i]: "target" }, "Jump straight to A[" + i + "] = <b>" + DA.data[i] + "</b>. No scanning: <b>O(1) random access</b> is the whole point of an array.");
      });
    },
    indexOf(v) {
      return daFrames((s) => {
        s.snap({}, "<b>indexOf(" + v + ")</b> — an unsorted array has no shortcut, so scan from the left.");
        for (let i = 0; i < DA.size; i++) {
          if (DA.data[i] === v) {
            s.snap({ [i]: "done" }, "A[" + i + "] = " + v + " — <b>found at index " + i + "</b> after " + (i + 1) + " comparison(s).");
            return;
          }
          s.snap({ [i]: "cmp" }, "A[" + i + "] = " + DA.data[i] + " ≠ " + v + ", keep going.");
        }
        s.snap({}, "Reached the end without a match — <b>" + v + " is not in the list</b>. Linear search is <b>O(n)</b>.");
      });
    },
  };

  const daPlayer = () =>
    new D.Player({
      mount: "#da-player",
      render(f) {
        if (!f.cells) return;
        const stage = q("da-stage");
        stage.innerHTML = "";
        stage.appendChild(daRow(f.cells, f.size, f.marks, "backing array (capacity " + f.cap + ")"));
        if (f.src) {
          const old = daRow(f.src.arr, f.src.arr.length, f.src.marks, "old array — about to be discarded");
          old.style.opacity = ".75";
          stage.appendChild(old);
        }
        q("da-size").textContent = f.size;
        q("da-cap").textContent = f.cap;
        q("da-load").textContent = f.cap ? Math.round((f.size / f.cap) * 100) + "%" : "–";
        q("da-copies").textContent = f.copies;
        q("da-grows").textContent = f.grows;
      },
    });

  function daRow(cells, size, marks, label) {
    const wrap = D.el("div", { style: "margin-bottom:1.1rem" });
    wrap.appendChild(D.el("div", { class: "small muted", text: label, style: "margin-bottom:.9rem" }));
    const row = D.el("div", { class: "cells" });
    cells.forEach((v, i) => {
      const filled = i < size && v !== null;
      const c = D.el("div", {
        class: "cell " + (marks[i] || "") + (filled ? " filled" : " empty"),
        text: filled ? v : "–",
      });
      c.appendChild(D.el("span", { class: "idx", text: i }));
      if (i === size) c.appendChild(D.el("span", { class: "ptr", text: "size" }));
      row.appendChild(c);
    });
    wrap.appendChild(row);
    return wrap;
  }

  /* =======================================================
     PART 2 — Linked lists
     ======================================================= */
  const LL = { vals: [], doubly: false };

  const NW = 58, NGAP = 40, PADX = 78, ROWY = 78;
  const nodeX = (i) => PADX + i * (NW + NGAP);

  function llFrames(build) {
    const R = new D.Recorder(1200);
    const s = {
      snap(opts) {
        R.push(
          Object.assign(
            { vals: LL.vals.slice(), doubly: LL.doubly, marks: {}, ptrs: {}, float: null, floatLinks: [], bypass: null, cuts: [] },
            opts || {}
          )
        );
      },
    };
    build(s);
    return R.frames;
  }

  /** walk from the head to index k, emitting a frame per hop */
  function llWalk(s, k, why) {
    for (let i = 0; i <= k; i++) {
      s.snap({
        marks: { [i]: "active" },
        ptrs: { cur: i },
        note: i === 0
          ? "Start at <b>head</b>. " + why
          : "Follow <span class='mono'>cur.next</span> — now at node " + i + " (value " + LL.vals[i] + "). Hop " + i + ".",
      });
    }
  }

  const llOps = {
    insertHead(v) {
      return llFrames((s) => {
        s.snap({ ptrs: {}, note: "<b>addFirst(" + v + ")</b>." });
        s.snap({ float: { v: v, at: -1, cls: "cmp" }, note: "Allocate a new node holding " + v + "." });
        if (LL.vals.length)
          s.snap({ float: { v: v, at: -1, cls: "cmp" }, floatLinks: [0], marks: { 0: "cmp" }, note: "Point <span class='mono'>new.next</span> at the old head. (Do this <em>first</em> — if you overwrite head first you lose the list.)" });
        LL.vals.unshift(v);
        s.snap({ marks: { 0: "done" }, ptrs: { head: 0 }, note: "Move <b>head</b> to the new node. <b>O(1)</b> — no traversal at all." });
      });
    },
    insertTail(v) {
      return llFrames((s) => {
        s.snap({ note: "<b>addLast(" + v + ")</b>." });
        if (!LL.vals.length) {
          LL.vals.push(v);
          s.snap({ marks: { 0: "done" }, note: "The list was empty, so the new node becomes both head and tail." });
          return;
        }
        llWalk(s, LL.vals.length - 1, "We need the last node, and a singly linked list can only move forward.");
        s.snap({ marks: { [LL.vals.length - 1]: "cmp" }, ptrs: { cur: LL.vals.length - 1 }, note: "<span class='mono'>cur.next == null</span>, so this is the tail." });
        s.snap({ float: { v: v, at: LL.vals.length - 1, cls: "cmp" }, note: "Allocate the new node." });
        LL.vals.push(v);
        s.snap({
          marks: { [LL.vals.length - 1]: "done" },
          note: "Set <span class='mono'>tail.next = new</span>. Without a stored tail pointer this walk makes addLast <b>O(n)</b>; keep a tail reference and it becomes O(1).",
        });
      });
    },
    insertAt(k, v) {
      return llFrames((s) => {
        s.snap({ note: "<b>insert(" + k + ", " + v + ")</b> — we need the node <em>before</em> position " + k + "." });
        if (k === 0) { s.snap({ note: "Index 0 is just addFirst." }); }
        else llWalk(s, k - 1, "Stop one short, at index " + (k - 1) + ".");
        s.snap({ float: { v: v, at: k - 1, cls: "cmp" }, floatLinks: k < LL.vals.length ? [k] : [], marks: { [k - 1]: "active" }, note: "Allocate the node and set <span class='mono'>new.next = prev.next</span>." });
        LL.vals.splice(k, 0, v);
        s.snap({ marks: { [k]: "done", [Math.max(0, k - 1)]: "active" }, note: "Then <span class='mono'>prev.next = new</span>. Two pointer writes, no shifting — that is the linked list's advantage over an array." });
      });
    },
    removeHead() {
      return llFrames((s) => {
        s.snap({ marks: { 0: "swap" }, ptrs: { head: 0 }, note: "<b>removeFirst()</b> — save the old head so we can return its value (" + LL.vals[0] + ")." });
        if (LL.vals.length > 1) s.snap({ marks: { 0: "swap", 1: "cmp" }, note: "Set <span class='mono'>head = head.next</span>." });
        const v = LL.vals.shift();
        s.snap({ ptrs: { head: 0 }, note: "Old node is unreachable and gets collected. Returned " + v + ". <b>O(1)</b>." });
      });
    },
    removeTail() {
      return llFrames((s) => {
        const n = LL.vals.length;
        if (n === 1) { const v = LL.vals.pop(); s.snap({ note: "Only one node — the list is now empty. Returned " + v + "." }); return; }
        llWalk(s, n - 2, "To unlink the tail we need its <em>predecessor</em>, which a singly linked list cannot reach backwards.");
        s.snap({ marks: { [n - 2]: "active", [n - 1]: "swap" }, ptrs: { prev: n - 2, cur: n - 1 }, note: "<span class='mono'>cur.next == null</span> → cur is the tail, prev is its predecessor." });
        const v = LL.vals.pop();
        s.snap({ marks: { [n - 2]: "done" }, note: "Set <span class='mono'>prev.next = null</span>. Returned " + v + ". <b>O(n)</b> even with a tail pointer — which is exactly why doubly linked lists exist." });
      });
    },
    removeAt(k) {
      return llFrames((s) => {
        s.snap({ note: "<b>remove(" + k + ")</b>." });
        llWalk(s, k - 1, "Walk to index " + (k - 1) + ", the predecessor.");
        s.snap({ marks: { [k - 1]: "active", [k]: "swap" }, bypass: { from: k - 1, to: k + 1 }, ptrs: { prev: k - 1, cur: k }, note: "Splice it out: <span class='mono'>prev.next = cur.next</span>, jumping over node " + k + "." });
        const v = LL.vals.splice(k, 1)[0];
        s.snap({ marks: { [k - 1]: "done" }, note: "Node holding " + v + " is now unreachable. The nodes around it never moved — only two pointers changed." });
      });
    },
    search(v) {
      return llFrames((s) => {
        s.snap({ note: "<b>search(" + v + ")</b> — no index arithmetic is possible, so follow next pointers one at a time." });
        for (let i = 0; i < LL.vals.length; i++) {
          if (LL.vals[i] === v) { s.snap({ marks: { [i]: "done" }, ptrs: { cur: i }, note: "<b>Found " + v + "</b> at position " + i + " after " + (i + 1) + " hop(s)." }); return; }
          s.snap({ marks: { [i]: "cmp" }, ptrs: { cur: i }, note: "Node " + i + " holds " + LL.vals[i] + " ≠ " + v + " — follow next." });
        }
        s.snap({ note: "Hit <span class='mono'>null</span> — <b>" + v + " is not in the list</b>. Linear search, <b>O(n)</b>." });
      });
    },
    reverse() {
      return llFrames((s) => {
        s.snap({ note: "<b>reverse()</b> — the classic three-pointer walk: <span class='mono'>prev</span>, <span class='mono'>cur</span>, <span class='mono'>next</span>." });
        const n = LL.vals.length;
        for (let i = 0; i < n; i++) {
          s.snap({ marks: Object.assign(doneUpTo(i), { [i]: "active" }), ptrs: Object.assign(i > 0 ? { prev: i - 1 } : {}, { cur: i }, i + 1 < n ? { next: i + 1 } : {}), note: "Remember <span class='mono'>next = cur.next</span>, then flip <span class='mono'>cur.next = prev</span>. Nodes 0…" + i + " now point backwards." });
        }
        LL.vals.reverse();
        s.snap({ marks: { 0: "done" }, ptrs: { head: 0 }, note: "Finally <span class='mono'>head = prev</span> (the old tail). Reversed in one pass, <b>O(n)</b> time and <b>O(1)</b> extra space." });
      });
      function doneUpTo(i) { const m = {}; for (let k = 0; k < i; k++) m[k] = "visit"; return m; }
    },
  };

  function llRender(f) {
    const stage = q("ll-stage");
    stage.innerHTML = "";
    if (!f.vals) return;
    const n = f.vals.length;
    const w = Math.max(360, nodeX(Math.max(1, n)) + 60);
    const h = f.float ? 210 : 170;
    const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + w + " " + h, width: w, height: h });
    svg.appendChild(
      D.svg("defs", {}, [
        marker("arw", "#5b6a92"), marker("arwOn", "#6ea8fe"), marker("arwCut", "#ff6b9d"),
      ])
    );

    /* head / tail labels */
    svg.appendChild(D.sText(30, ROWY + 20, "head", { class: "lbl-s", "font-size": 12, fill: "#6ea8fe" }));
    if (n) {
      svg.appendChild(arrow(46, ROWY + 20, nodeX(0) - 6, ROWY + 20, "on"));
    } else {
      svg.appendChild(D.sText(nodeX(0) + 10, ROWY + 20, "null", { class: "lbl-s", "font-size": 13 }));
    }

    for (let i = 0; i < n; i++) {
      const x = nodeX(i), y = ROWY;
      const g = D.svg("g", {});
      g.appendChild(D.svg("rect", { x: x, y: y, width: NW, height: 40, rx: 8, class: "node-c " + (f.marks[i] || "") }));
      g.appendChild(D.sText(x + NW / 2, y + 20, f.vals[i], { "font-size": 14 }));
      g.appendChild(D.sText(x + NW / 2, y - 12, i, { class: "lbl-s" }));
      svg.appendChild(g);

      /* forward link */
      if (i < n - 1) svg.appendChild(arrow(x + NW, y + (f.doubly ? 13 : 20), nodeX(i + 1) - 6, y + (f.doubly ? 13 : 20), f.marks[i] === "active" || f.marks[i] === "done" ? "on" : ""));
      else {
        svg.appendChild(arrow(x + NW, y + (f.doubly ? 13 : 20), x + NW + 22, y + (f.doubly ? 13 : 20), ""));
        svg.appendChild(D.sText(x + NW + 40, y + (f.doubly ? 13 : 20), "null", { class: "lbl-s" }));
      }
      /* backward link */
      if (f.doubly) {
        if (i > 0) svg.appendChild(arrow(x - 6, y + 30, nodeX(i - 1) + NW, y + 30, "dim"));
        else { svg.appendChild(arrow(x - 6, y + 30, x - 26, y + 30, "dim")); svg.appendChild(D.sText(x - 44, y + 30, "null", { class: "lbl-s" })); }
      }
      /* pointer callouts */
      const names = Object.keys(f.ptrs).filter((k) => f.ptrs[k] === i);
      if (names.length) svg.appendChild(D.sText(x + NW / 2, y + 64, names.join(" / "), { class: "lbl-s", fill: "#ffc14d", "font-size": 12 }));
    }

    /* floating (newly allocated) node */
    if (f.float) {
      const fx = f.float.at < 0 ? nodeX(0) - 10 : nodeX(f.float.at) + (NW + NGAP) / 2 + 6;
      const fy = 14;
      svg.appendChild(D.svg("rect", { x: fx, y: fy, width: NW, height: 34, rx: 8, class: "node-c " + (f.float.cls || "cmp"), "stroke-dasharray": "5 3" }));
      svg.appendChild(D.sText(fx + NW / 2, fy + 17, f.float.v, { "font-size": 14 }));
      svg.appendChild(D.sText(fx + NW / 2 + 4, fy - 4, "new node", { class: "lbl-s", "font-size": 10 }));
      (f.floatLinks || []).forEach((t) => {
        if (t < n) svg.appendChild(curve(fx + NW / 2, fy + 34, nodeX(t) + NW / 2, ROWY - 2, "on", true));
      });
    }

    /* bypass arrow used when unlinking */
    if (f.bypass) {
      const a = nodeX(f.bypass.from) + NW / 2, b = f.bypass.to < n ? nodeX(f.bypass.to) + NW / 2 : nodeX(n - 1) + NW + 30;
      svg.appendChild(curve(a, ROWY - 2, b, ROWY - 2, "on"));
    }

    if (!n) svg.appendChild(D.sText(w / 2, 30, "empty list", { class: "lbl-s", "font-size": 13 }));
    stage.appendChild(svg);
    q("ll-len").textContent = n;
    q("ll-kind").textContent = f.doubly ? "doubly linked" : "singly linked";
  }

  function marker(id, color) {
    return D.svg("marker", { id: id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, [
      D.svg("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: color }),
    ]);
  }
  function arrow(x1, y1, x2, y2, cls) {
    const l = D.sLine(x1, y1, x2, y2, "edge " + (cls || ""));
    l.setAttribute("marker-end", "url(#" + (cls === "on" ? "arwOn" : "arw") + ")");
    return l;
  }
  function curve(x1, y1, x2, y2, cls, down) {
    const lift = down ? 26 : -34;
    const p = D.svg("path", {
      d: "M " + x1 + " " + y1 + " C " + x1 + " " + (y1 + lift) + ", " + x2 + " " + (y2 + lift) + ", " + x2 + " " + y2,
      class: "edge " + (cls || ""),
    });
    p.setAttribute("marker-end", "url(#arwOn)");
    return p;
  }

  /* =======================================================
     init
     ======================================================= */
  document.addEventListener("DOMContentLoaded", function () {
    /* ---- dynamic array ---- */
    const dap = daPlayer();
    const daRun = (frames) => dap.load(frames, true);
    const idxOf = (id) => parseInt(q(id).value, 10);
    const valOf = (id) => { const v = parseInt(q(id).value, 10); return isNaN(v) ? D.randInt(10, 99) : v; };

    q("da-add").addEventListener("click", () => daRun(daOps.add(valOf("da-val"))));
    q("da-insert").addEventListener("click", () => {
      const i = idxOf("da-idx");
      if (isNaN(i) || i < 0 || i > DA.size) return D.toast("Index must be between 0 and " + DA.size + ".", true);
      daRun(daOps.insert(i, valOf("da-val")));
    });
    q("da-remove").addEventListener("click", () => {
      const i = idxOf("da-idx");
      if (isNaN(i) || i < 0 || i >= DA.size) return D.toast("Index must be between 0 and " + (DA.size - 1) + ".", true);
      daRun(daOps.removeAt(i));
    });
    q("da-get").addEventListener("click", () => {
      const i = idxOf("da-idx");
      if (isNaN(i) || i < 0 || i >= DA.size) return D.toast("Index must be between 0 and " + (DA.size - 1) + ".", true);
      daRun(daOps.get(i));
    });
    q("da-find").addEventListener("click", () => daRun(daOps.indexOf(valOf("da-val"))));
    q("da-fill").addEventListener("click", () => {
      DA.cap = 4; DA.data = new Array(4).fill(null); DA.size = 0; DA.copies = 0; DA.grows = 0;
      const vals = D.randArray(9, 10, 99);
      const R = [];
      vals.forEach((v) => { daOps.add(v).forEach((f) => R.push(f)); });
      dap.load(R, true);
    });
    q("da-clear").addEventListener("click", () => {
      DA.cap = 4; DA.data = new Array(4).fill(null); DA.size = 0; DA.copies = 0; DA.grows = 0;
      dap.load(daFrames((s) => s.snap({}, "Reset: an empty ArrayList with capacity 4.")), false);
    });
    /* start with a few elements */
    (function () {
      const R = [];
      [23, 47, 8, 91, 15].forEach((v) => daOps.add(v).forEach((f) => R.push(f)));
      dap.load([R[R.length - 1]], false);
    })();

    /* ---- linked list ---- */
    const llp = new D.Player({ mount: "#ll-player", render: llRender });
    const llRun = (frames) => llp.load(frames, true);
    const llVal = () => { const v = parseInt(q("ll-val").value, 10); return isNaN(v) ? D.randInt(10, 99) : v; };
    const llIdx = () => parseInt(q("ll-idx").value, 10);

    D.Tabs("#ll-tabs", [{ id: "single", label: "Singly linked" }, { id: "double", label: "Doubly linked" }], (id) => {
      LL.doubly = id === "double";
      q("ll-note").innerHTML = LL.doubly
        ? "A doubly linked list stores <span class='mono'>prev</span> as well as <span class='mono'>next</span>. That costs one extra pointer per node but makes <b>removeLast</b> and backwards traversal O(1) — you no longer have to walk the list to find a node's predecessor."
        : "A singly linked list only stores <span class='mono'>next</span>. Insertion at the head is O(1), but anything that needs a predecessor (removeLast, remove at index) has to walk from the head, so it is O(n).";
      llp.load(llFrames((s) => s.snap({ note: "Showing a <b>" + (LL.doubly ? "doubly" : "singly") + " linked list</b> with " + LL.vals.length + " node(s)." })), false);
    });

    q("ll-head").addEventListener("click", () => llRun(llOps.insertHead(llVal())));
    q("ll-tail").addEventListener("click", () => llRun(llOps.insertTail(llVal())));
    q("ll-insert").addEventListener("click", () => {
      const i = llIdx();
      if (isNaN(i) || i < 0 || i > LL.vals.length) return D.toast("Index must be 0…" + LL.vals.length + ".", true);
      llRun(i === 0 ? llOps.insertHead(llVal()) : llOps.insertAt(i, llVal()));
    });
    q("ll-rhead").addEventListener("click", () => { if (!LL.vals.length) return D.toast("The list is empty.", true); llRun(llOps.removeHead()); });
    q("ll-rtail").addEventListener("click", () => { if (!LL.vals.length) return D.toast("The list is empty.", true); llRun(llOps.removeTail()); });
    q("ll-rat").addEventListener("click", () => {
      const i = llIdx();
      if (isNaN(i) || i < 0 || i >= LL.vals.length) return D.toast("Index must be 0…" + (LL.vals.length - 1) + ".", true);
      llRun(i === 0 ? llOps.removeHead() : llOps.removeAt(i));
    });
    q("ll-search").addEventListener("click", () => llRun(llOps.search(llVal())));
    q("ll-reverse").addEventListener("click", () => { if (LL.vals.length < 2) return D.toast("Need at least two nodes.", true); llRun(llOps.reverse()); });
    q("ll-clear").addEventListener("click", () => { LL.vals = []; llp.load(llFrames((s) => s.snap({ note: "Cleared — <span class='mono'>head = null</span>." })), false); });
    q("ll-rand").addEventListener("click", () => {
      LL.vals = D.randArray(D.randInt(4, 6), 10, 99);
      llp.load(llFrames((s) => s.snap({ note: "Built a list of " + LL.vals.length + " random nodes." })), false);
    });

    LL.vals = [31, 7, 64, 12];
    llp.load(llFrames((s) => s.snap({ note: "A four-node singly linked list. Try an operation above." })), false);

    D.legend("#ll-legend", [
      { color: "var(--c-active)", label: "cur / just relinked" },
      { color: "var(--c-cmp)", label: "being examined / new node" },
      { color: "var(--c-swap)", label: "being unlinked" },
      { color: "var(--c-done)", label: "result" },
      { color: "var(--c-visit)", label: "already flipped" },
    ]);
  });
})();
