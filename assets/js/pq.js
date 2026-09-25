/* ============================================================
   heaps.js — binary heap as array and tree at the same time
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);
  const MAXN = 31;

  const H = { a: [], min: true };
  let player;

  /* better(x, y) — is x allowed to sit above y? */
  const better = (x, y) => (H.min ? x < y : x > y);
  const word = () => (H.min ? "min" : "max");
  const root = () => (H.min ? "minimum" : "maximum");

  function Ctx(limit) {
    const R = new D.Recorder(limit || 1200);
    return {
      cmp: 0, swaps: 0, heapSize: null, sorted: new Set(),
      snap(marks, note, extra) {
        const m = {};
        this.sorted.forEach((i) => (m[i] = "done"));
        Object.assign(m, marks || {});
        R.push(
          Object.assign(
            { arr: H.a.slice(), marks: m, note: note, cmp: this.cmp, swaps: this.swaps, min: H.min, heapSize: this.heapSize },
            extra || {}
          )
        );
      },
      frames: R.frames,
      over: () => R.overflow,
    };
  }

  const P = (i) => Math.floor((i - 1) / 2);
  const L = (i) => 2 * i + 1;
  const Rc = (i) => 2 * i + 2;

  /* ---------------- up-heap ---------------- */
  function upHeap(c, i, extraNote) {
    while (i > 0) {
      const p = P(i);
      c.cmp++;
      c.snap({ [i]: "active", [p]: "cmp" }, "Compare with the parent: A[" + i + "] = " + H.a[i] + " vs A[" + p + "] = " + H.a[p] + ". <span class='mono'>parent(i) = ⌊(i−1)/2⌋ = " + p + "</span>.");
      if (!better(H.a[i], H.a[p])) {
        c.snap({ [i]: "done", [p]: "visit" }, "The parent is already " + (H.min ? "smaller" : "larger") + " (or equal), so the heap-order property holds — <b>stop</b>. " + (extraNote || ""));
        return;
      }
      [H.a[i], H.a[p]] = [H.a[p], H.a[i]];
      c.swaps++;
      c.snap({ [p]: "swap", [i]: "swap" }, "Heap order is violated — <b>swap up</b>. The value keeps rising toward the root.");
      i = p;
    }
    c.snap({ 0: "done" }, "Reached the root, so this value is the new <b>" + root() + "</b>. At most ⌈log₂n⌉ swaps — the height of the tree.");
  }

  /* ---------------- down-heap ---------------- */
  function downHeap(c, i, size) {
    for (;;) {
      const l = L(i), r = Rc(i);
      if (l >= size) {
        c.snap({ [i]: "done" }, "Index " + i + " has no children (2i+1 = " + l + " ≥ size " + size + ") — it is a leaf, so we are done sifting.");
        return;
      }
      let best = l;
      if (r < size) {
        c.cmp++;
        if (better(H.a[r], H.a[l])) best = r;
        c.snap({ [i]: "active", [l]: "cmp", [r]: "cmp" }, "Children of " + i + " are at 2i+1 = " + l + " (" + H.a[l] + ") and 2i+2 = " + r + " (" + H.a[r] + "). The better one is A[" + best + "] = " + H.a[best] + ".");
      } else {
        c.snap({ [i]: "active", [l]: "cmp" }, "Only a left child at " + l + " (" + H.a[l] + ").");
      }
      c.cmp++;
      if (!better(H.a[best], H.a[i])) {
        c.snap({ [i]: "done", [best]: "visit" }, "A[" + i + "] = " + H.a[i] + " is already better than its children — heap order restored, <b>stop</b>.");
        return;
      }
      [H.a[i], H.a[best]] = [H.a[best], H.a[i]];
      c.swaps++;
      c.snap({ [i]: "swap", [best]: "swap" }, "Swap down with the " + (best === l ? "left" : "right") + " child. Always swap with the <b>better</b> child, or the swapped-up value could still violate the order.");
      i = best;
    }
  }

  /* ---------------- operations ---------------- */
  const ops = {
    insert(v) {
      const c = Ctx();
      if (H.a.length >= MAXN) { c.snap({}, "This demo caps the heap at " + MAXN + " nodes so the tree still fits on screen."); return c; }
      c.snap({}, "<b>insert(" + v + ")</b> into a " + word() + "-heap of " + H.a.length + " node(s).");
      H.a.push(v);
      c.snap({ [H.a.length - 1]: "active" }, "Put it in the <b>next free array slot</b>, index " + (H.a.length - 1) + ". That keeps the tree <em>complete</em> — every level full except possibly the last, filled left to right. Heap order may now be broken.");
      upHeap(c, H.a.length - 1);
      c.snap({}, "Insert finished in <b>O(log n)</b>: one array write plus at most one swap per level.");
      return c;
    },
    removeRoot() {
      const c = Ctx();
      if (!H.a.length) { c.snap({}, "The heap is empty."); return c; }
      c.snap({ 0: "target" }, "<b>remove" + (H.min ? "Min" : "Max") + "()</b> — the answer is always the root, A[0] = <b>" + H.a[0] + "</b>. Reading it is O(1); the work is repairing the heap afterwards.");
      const last = H.a.length - 1;
      if (last === 0) { const v = H.a.pop(); c.snap({}, "That was the only node — the heap is now empty. Returned " + v + "."); return c; }
      c.snap({ 0: "swap", [last]: "swap" }, "Move the <b>last</b> node (A[" + last + "] = " + H.a[last] + ") into the root and shrink the array. Only the last node can be removed without leaving a hole in a complete tree.");
      H.a[0] = H.a[last];
      H.a.pop();
      c.snap({ 0: "active" }, "The array is now " + H.a.length + " long. The root almost certainly violates heap order, so <b>sift it down</b>.");
      downHeap(c, 0, H.a.length);
      c.snap({}, "Repaired in <b>O(log n)</b> — at most the height of the tree in swaps.");
      return c;
    },
    peek() {
      const c = Ctx();
      if (!H.a.length) { c.snap({}, "Empty heap."); return c; }
      c.snap({ 0: "target" }, "<b>peek()</b> = " + H.a[0] + ". A heap gives you the extreme element in <b>O(1)</b> — but says almost nothing about the order of everything else.");
      return c;
    },
    buildBottomUp(vals) {
      const c = Ctx(1600);
      H.a = vals.slice();
      c.snap({}, "<b>Bottom-up heapify.</b> Start from an arbitrary array of " + H.a.length + " values — currently <em>not</em> a heap.");
      const start = Math.floor(H.a.length / 2) - 1;
      c.snap({}, "Every index from ⌊n/2⌋ = " + Math.floor(H.a.length / 2) + " onwards is a leaf, and a single node is already a valid heap. So only indices " + start + " … 0 need work.");
      for (let i = start; i >= 0; i--) {
        c.snap({ [i]: "active" }, "Sift down from index " + i + ". Both of its subtrees are already valid heaps, so one down-heap fixes the whole subtree.");
        downHeap(c, i, H.a.length);
      }
      c.snap({ 0: "target" }, "Done — a valid " + word() + "-heap in <b>Θ(n)</b>: most nodes are near the bottom and barely move. Half the nodes are leaves and cost nothing, a quarter can sink at most one level, and so on — Σ (n/2^h)·h converges to 2n, so this is at most about 2n comparisons <b>whatever the input order</b>.");
      return c;
    },
    buildByInsert(vals) {
      const c = Ctx(2200);
      H.a = [];
      c.snap({}, "<b>Build by repeated insertion</b> of the same " + vals.length + " values, for comparison.");
      vals.forEach((v) => {
        H.a.push(v);
        c.snap({ [H.a.length - 1]: "active" }, "insert(" + v + ") — append at index " + (H.a.length - 1) + ", then up-heap.");
        upHeap(c, H.a.length - 1);
      });
      c.snap({ 0: "target" }, "Also a valid heap, but the worst case is <b>Θ(n log n)</b>: each of the n inserts can climb the full height. On <em>random</em> data most inserts stop after a level or two, so it is close to linear too — press <b>worst-case order</b> to feed it the input that actually forces every element to the root, then run bottom-up heapify on the same values and compare the counters.");
      return c;
    },
    heapSort() {
      const c = Ctx(2600);
      if (H.a.length < 2) { c.snap({}, "Need at least two elements."); return c; }
      c.snap({}, "<b>Heap-sort</b> in place. A " + word() + "-heap sorts " + (H.min ? "descending" : "ascending") + ": the root goes to the back each round.");
      c.heapSize = H.a.length;
      for (let end = H.a.length - 1; end >= 1; end--) {
        [H.a[0], H.a[end]] = [H.a[end], H.a[0]];
        c.swaps++;
        c.sorted.add(end);
        c.heapSize = end;
        c.snap({ 0: "swap", [end]: "swap" }, "Swap the root (" + H.a[end] + ") into index " + end + " — that position is now <b>final</b>. The heap shrinks to " + end + " nodes.");
        downHeap(c, 0, end);
      }
      c.sorted.add(0);
      c.heapSize = 0;
      c.snap({}, "Heap empty, array sorted — <b>O(n log n)</b> with <b>O(1)</b> extra space.");
      return c;
    },
  };

  /* ---------------- rendering ---------------- */
  function render(f) {
    if (!f.arr) return;
    /* array view */
    const av = q("arr-view");
    av.innerHTML = "";
    const row = D.el("div", { class: "cells" });
    f.arr.forEach((v, i) => {
      const inHeap = f.heapSize == null || i < f.heapSize;
      const c = D.el("div", { class: "cell filled " + (f.marks[i] || "") + (inHeap ? "" : " ghost"), text: v, style: "min-width:44px;height:40px;font-size:.84rem" });
      c.appendChild(D.el("span", { class: "idx", text: i }));
      if (i === 0 && inHeap) c.appendChild(D.el("span", { class: "ptr", text: "root" }));
      row.appendChild(c);
    });
    const holder = D.el("div", { style: "padding:1.25rem 0 1.5rem" });
    holder.appendChild(f.arr.length ? row : D.el("div", { class: "small muted", text: "empty heap" }));
    av.appendChild(holder);

    /* tree view */
    const tv = q("tree-view");
    tv.innerHTML = "";
    const n = f.arr.length;
    const maxD = n ? Math.floor(Math.log2(n)) : 0;
    const slots = Math.pow(2, maxD);
    const W = Math.max(340, slots * 52 + 40);
    const Hh = 46 + maxD * 66 + 30;
    const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + W + " " + Hh, width: W, height: Hh });
    const pos = (i) => {
      const d = Math.floor(Math.log2(i + 1));
      const idxInLevel = i - (Math.pow(2, d) - 1);
      const cells = Math.pow(2, d);
      return { x: ((idxInLevel + 0.5) * (W - 30)) / cells + 15, y: 32 + d * 66, d: d };
    };
    for (let i = 1; i < n; i++) {
      const a = pos(P(i)), b = pos(i);
      const dim = f.heapSize != null && (i >= f.heapSize || P(i) >= f.heapSize);
      svg.appendChild(D.sLine(a.x, a.y + 17, b.x, b.y - 17, "edge " + (dim ? "dim" : "")));
    }
    for (let i = 0; i < n; i++) {
      const p = pos(i);
      const cls = f.marks[i] || "";
      const dim = f.heapSize != null && i >= f.heapSize;
      const g = D.svg("g", { opacity: dim ? .4 : 1 });
      g.appendChild(D.svg("circle", { cx: p.x, cy: p.y, r: 17, class: "node-c " + cls }));
      g.appendChild(D.sText(p.x, p.y, f.arr[i], { "font-size": 12 }));
      g.appendChild(D.sText(p.x, p.y + 27, i, { class: "lbl-s", "font-size": 9 }));
      svg.appendChild(g);
    }
    if (!n) svg.appendChild(D.sText(W / 2, 40, "empty", { class: "lbl-s" }));
    tv.appendChild(svg);

    q("h-size").textContent = n;
    q("h-height").textContent = n ? Math.floor(Math.log2(n)) : 0;
    q("h-root").textContent = n ? f.arr[0] : "–";
    q("h-cmp").textContent = f.cmp;
    q("h-swaps").textContent = f.swaps;
    q("h-kind").textContent = f.min ? "min-heap" : "max-heap";
  }

  function show(c) { if (c.over && c.over()) D.toast("Step limit reached.", true); player.load(c.frames, true); }
  function still(note) { const c = Ctx(); c.snap({}, note); player.load(c.frames, false); }

  /* ---------------- init ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    player = new D.Player({ mount: "#player", render: render });
    const val = () => { const v = parseInt(q("val").value, 10); return isNaN(v) ? D.randInt(1, 99) : v; };

    /* both build strategies run on the same values so the counters are comparable */
    let buildVals = [];
    const getVals = () => {
      if (buildVals.length < 6) buildVals = D.randArray(12, 1, 99);
      return buildVals.slice();
    };

    q("op-insert").addEventListener("click", () => show(ops.insert(val())));
    q("op-remove").addEventListener("click", () => show(ops.removeRoot()));
    q("op-peek").addEventListener("click", () => show(ops.peek()));
    q("op-heapify").addEventListener("click", () => show(ops.buildBottomUp(getVals())));
    q("op-insertbuild").addEventListener("click", () => show(ops.buildByInsert(getVals())));
    q("op-worst").addEventListener("click", () => {
      /* every insert becomes the new root, so each one climbs the full height */
      buildVals = [];
      for (let i = 15; i >= 1; i--) buildVals.push(H.min ? i : 16 - i);
      show(ops.buildByInsert(buildVals.slice()));
      D.toast("Now press “bottom-up heapify” — same 15 values, far fewer comparisons.");
    });
    q("op-sort").addEventListener("click", () => show(ops.heapSort()));
    q("op-rand").addEventListener("click", () => { buildVals = D.randArray(D.randInt(9, 14), 1, 99); show(ops.buildBottomUp(buildVals.slice())); });
    q("op-clear").addEventListener("click", () => { H.a = []; buildVals = []; still("Cleared."); });
    q("op-load").addEventListener("click", () => {
      const v = D.parseNums(q("custom").value).slice(0, MAXN);
      if (v.length < 1) return D.toast("Enter some numbers.", true);
      buildVals = v.slice();
      show(ops.buildBottomUp(v));
    });
    q("kind").addEventListener("change", (e) => {
      H.min = e.target.value === "min";
      if (H.a.length) show(ops.buildBottomUp(H.a.slice()));
      else still("Switched to a " + word() + "-heap.");
    });

    D.legend("#legend", [
      { color: "var(--c-active)", label: "node being sifted" },
      { color: "var(--c-cmp)", label: "compared (parent / children)" },
      { color: "var(--c-swap)", label: "swapped" },
      { color: "var(--c-done)", label: "settled / final" },
      { color: "var(--c-target)", label: "root (the answer)" },
    ]);

    show(ops.buildBottomUp([37, 12, 55, 8, 41, 26, 63, 5, 19]));
    player.pause();
    player.goto(player.frames.length - 1);
  });
})();
