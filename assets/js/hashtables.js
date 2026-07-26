/* ============================================================
   hashtables.js — separate chaining + three open-addressing
   probe strategies, with load factor and rehashing
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);

  const T = {
    mode: "chain",      /* chain | linear | quad | double */
    m: 11,
    slots: [],          /* chain: array of arrays. open: {k} | null | TOMB */
    n: 0,
    auto: true,
    probesTotal: 0,
    opsTotal: 0,
  };
  const TOMB = "☠";   /* tombstone marker */
  let player;

  /* ---------------- hashing ---------------- */
  function hashCode(k) {
    if (typeof k === "number") return k;
    let h = 0;
    for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0;
    return h;
  }
  const h1 = (k, m) => ((hashCode(k) % m) + m) % m;
  function isPrime(x) { if (x < 2) return false; for (let d = 2; d * d <= x; d++) if (x % d === 0) return false; return true; }
  function prevPrime(x) { while (x > 2 && !isPrime(x)) x--; return Math.max(2, x); }
  function nextPrime(x) { while (!isPrime(x)) x++; return x; }
  const secondary = (m) => prevPrime(m - 1);
  function h2(k, m) { const qq = secondary(m); return qq - (((hashCode(k) % qq) + qq) % qq); }

  function probeAt(k, i) {
    const base = h1(k, T.m);
    if (T.mode === "linear") return (base + i) % T.m;
    if (T.mode === "quad") return (base + i * i) % T.m;
    if (T.mode === "double") return (base + i * h2(k, T.m)) % T.m;
    return base;
  }
  function probeFormula(k, i) {
    const base = h1(k, T.m);
    if (T.mode === "linear") return "(h(k) + " + i + ") mod " + T.m + " = (" + base + " + " + i + ") mod " + T.m + " = " + probeAt(k, i);
    if (T.mode === "quad") return "(h(k) + " + i + "²) mod " + T.m + " = (" + base + " + " + i * i + ") mod " + T.m + " = " + probeAt(k, i);
    if (T.mode === "double") return "(h(k) + " + i + "·h₂(k)) mod " + T.m + " = (" + base + " + " + i + "·" + h2(k, T.m) + ") mod " + T.m + " = " + probeAt(k, i);
    return String(base);
  }
  const hashNote = (k) =>
    typeof k === "number"
      ? "<span class='mono'>h(" + k + ") = " + k + " mod " + T.m + " = " + h1(k, T.m) + "</span>"
      : "<span class='mono'>h(\"" + k + "\") = " + hashCode(k) + " mod " + T.m + " = " + h1(k, T.m) + "</span>";

  const alpha = () => T.n / T.m;
  const threshold = () => (T.mode === "chain" ? 0.9 : 0.6);

  function fresh(m) {
    T.m = m;
    T.slots = new Array(m);
    for (let i = 0; i < m; i++) T.slots[i] = T.mode === "chain" ? [] : null;
    T.n = 0;
  }

  /* ---------------- recorder ---------------- */
  function Ctx(limit) {
    const R = new D.Recorder(limit || 1000);
    return {
      probes: 0,
      frames: R.frames,
      snap(marks, note, extra) {
        R.push(
          Object.assign(
            {
              mode: T.mode,
              m: T.m,
              n: T.n,
              slots: T.slots.map((s) => (Array.isArray(s) ? s.slice() : s)),
              marks: marks || {},
              note: note,
              probes: this.probes,
              alpha: alpha(),
            },
            extra || {}
          )
        );
      },
    };
  }

  /* ---------------- chaining ---------------- */
  function chainInsert(c, k) {
    const i = h1(k, T.m);
    c.snap({ [i]: "active" }, "<b>insert(" + fmtk(k) + ")</b> — " + hashNote(k) + ", so it belongs in bucket <b>" + i + "</b>.");
    const chain = T.slots[i];
    for (let j = 0; j < chain.length; j++) {
      c.probes++;
      c.snap({ [i]: "cmp" }, "Bucket " + i + " already holds " + chain.length + " key(s) — a <b>collision</b>. Walk the chain: is node " + j + " (" + fmtk(chain[j]) + ") the same key?", { chainMark: { b: i, j: j, cls: "cmp" } });
      if (String(chain[j]) === String(k)) { c.snap({ [i]: "done" }, "Duplicate key — nothing to insert.", { chainMark: { b: i, j: j, cls: "done" } }); return; }
    }
    chain.unshift(k);
    T.n++;
    c.probes++;
    c.snap({ [i]: "done" }, "Add it at the <b>front</b> of bucket " + i + "'s list — O(1), no shifting. Chain length is now " + chain.length + ". Load factor α = n/m = " + T.n + "/" + T.m + " = " + alpha().toFixed(2) + ".", { chainMark: { b: i, j: 0, cls: "done" } });
  }
  function chainSearch(c, k) {
    const i = h1(k, T.m);
    c.snap({ [i]: "active" }, "<b>search(" + fmtk(k) + ")</b> — " + hashNote(k) + ". Only bucket " + i + " can possibly hold it.");
    const chain = T.slots[i];
    if (!chain.length) { c.snap({ [i]: "swap" }, "Bucket " + i + " is empty, so <b>" + fmtk(k) + " is not in the table</b>. One probe, done."); return; }
    for (let j = 0; j < chain.length; j++) {
      c.probes++;
      c.snap({ [i]: "cmp" }, "Compare with node " + j + ": " + fmtk(chain[j]) + ".", { chainMark: { b: i, j: j, cls: "cmp" } });
      if (String(chain[j]) === String(k)) { c.snap({ [i]: "done" }, "<b>Found</b> after " + c.probes + " comparison(s). Expected cost is 1 + α/2 — which is O(1) as long as α stays small.", { chainMark: { b: i, j: j, cls: "done" } }); return; }
    }
    c.snap({ [i]: "swap" }, "End of the chain — <b>not found</b> after " + c.probes + " comparison(s).");
  }
  function chainDelete(c, k) {
    const i = h1(k, T.m);
    c.snap({ [i]: "active" }, "<b>delete(" + fmtk(k) + ")</b> — hash to bucket " + i + ".");
    const chain = T.slots[i];
    for (let j = 0; j < chain.length; j++) {
      c.probes++;
      c.snap({ [i]: "cmp" }, "Check node " + j + " (" + fmtk(chain[j]) + ").", { chainMark: { b: i, j: j, cls: "cmp" } });
      if (String(chain[j]) === String(k)) {
        chain.splice(j, 1);
        T.n--;
        c.snap({ [i]: "done" }, "Unlink it. Chaining deletion is genuinely simple — <b>no tombstones needed</b>, because nothing else's probe path runs through this node.");
        return;
      }
    }
    c.snap({ [i]: "swap" }, "<b>" + fmtk(k) + "</b> is not in the table — nothing to delete.");
  }

  /* ---------------- open addressing ---------------- */
  function openInsert(c, k) {
    c.snap({}, "<b>insert(" + fmtk(k) + ")</b> — " + hashNote(k) + ". With open addressing every key lives in the table itself, so on a collision we <em>probe</em> for another slot.");
    let firstTomb = -1;
    for (let i = 0; i < T.m; i++) {
      const p = probeAt(k, i);
      c.probes++;
      const cellIs = T.slots[p] === null ? "empty" : T.slots[p] === TOMB ? "a tombstone" : "occupied by " + fmtk(T.slots[p]);
      c.snap({ [p]: T.slots[p] == null || T.slots[p] === TOMB ? "active" : "cmp" }, "Probe " + i + ": " + probeFormula(k, i) + " → slot " + p + " is " + cellIs + ".");
      if (T.slots[p] === null) {
        const at = firstTomb >= 0 ? firstTomb : p;
        T.slots[at] = k;
        T.n++;
        c.snap({ [at]: "done" }, "Empty slot reached, so the key is definitely not already in the table. Store it at <b>" + at + "</b>" + (firstTomb >= 0 ? " — the earlier tombstone, which we can safely reuse" : "") + ". Probes used: " + c.probes + ".");
        return;
      }
      if (T.slots[p] === TOMB) { if (firstTomb < 0) firstTomb = p; continue; }
      if (String(T.slots[p]) === String(k)) { c.snap({ [p]: "done" }, "That is the same key — duplicate, nothing to do."); return; }
    }
    c.snap({}, "Probed all " + T.m + " slots without finding room. " + (T.mode === "quad" ? "Quadratic probing only guarantees it can find a free slot while α &lt; 0.5 and m is prime — this is exactly that failure." : "The table is full."));
  }
  function openSearch(c, k) {
    c.snap({}, "<b>search(" + fmtk(k) + ")</b> — " + hashNote(k) + ". Follow the <em>same probe sequence</em> the insert would have used.");
    for (let i = 0; i < T.m; i++) {
      const p = probeAt(k, i);
      c.probes++;
      c.snap({ [p]: T.slots[p] == null ? "active" : "cmp" }, "Probe " + i + ": " + probeFormula(k, i) + " → slot " + p + ".");
      if (T.slots[p] === null) { c.snap({ [p]: "swap" }, "An <b>empty</b> slot stops the search: if the key existed it would have been placed here. <b>Not found</b> in " + c.probes + " probes."); return; }
      if (T.slots[p] === TOMB) { c.snap({ [p]: "visit" }, "A tombstone means \"something was deleted here, keep going\" — it must <b>not</b> stop the search, or we would lose keys placed after it."); continue; }
      if (String(T.slots[p]) === String(k)) { c.snap({ [p]: "done" }, "<b>Found " + fmtk(k) + "</b> at slot " + p + " after " + c.probes + " probe(s)."); return; }
    }
    c.snap({}, "Wrapped all the way round — <b>not found</b>.");
  }
  function openDelete(c, k) {
    c.snap({}, "<b>delete(" + fmtk(k) + ")</b> — find it first, along the probe sequence.");
    for (let i = 0; i < T.m; i++) {
      const p = probeAt(k, i);
      c.probes++;
      c.snap({ [p]: "cmp" }, "Probe " + i + " → slot " + p + ".");
      if (T.slots[p] === null) { c.snap({ [p]: "swap" }, "Empty slot — <b>" + fmtk(k) + "</b> is not in the table."); return; }
      if (T.slots[p] !== TOMB && String(T.slots[p]) === String(k)) {
        T.slots[p] = TOMB;
        T.n--;
        c.snap({ [p]: "visit" }, "Found it. We cannot simply blank the slot — that would break the probe chain of any key that collided here. Instead mark it with a <b>tombstone</b> (☠): searches pass through it, inserts may reuse it.");
        return;
      }
    }
    c.snap({}, "Not found.");
  }

  /* ---------------- rehash ---------------- */
  function rehash(c, why) {
    const old = T.slots, oldM = T.m;
    const keys = [];
    old.forEach((s) => { if (Array.isArray(s)) s.forEach((k) => keys.push(k)); else if (s !== null && s !== TOMB) keys.push(s); });
    const nm = nextPrime(oldM * 2 + 1);
    c.snap({}, "<b>Rehash.</b> " + why + " Allocate a new table of size <b>" + nm + "</b> (a prime, so the modulo spreads keys well) and reinsert all " + keys.length + " keys.");
    fresh(nm);
    keys.forEach((k) => {
      if (T.mode === "chain") { T.slots[h1(k, T.m)].unshift(k); T.n++; }
      else { for (let i = 0; i < T.m; i++) { const p = probeAt(k, i); if (T.slots[p] === null) { T.slots[p] = k; T.n++; break; } } }
      c.snap({ [h1(k, T.m)]: "done" }, "Reinsert " + fmtk(k) + ": h(k) mod " + T.m + " = " + h1(k, T.m) + ". Every key moves — <b>every</b> hash changes when m changes, which is why rehashing costs Θ(n).");
    });
    c.snap({}, "Rehash complete. α is back down to " + alpha().toFixed(2) + ". Doubling means rehashes are rare enough that insert stays <b>O(1) amortised</b>.");
  }

  /* ---------------- op driver ---------------- */
  function doOp(kind, k) {
    const c = Ctx(1400);
    if (kind === "insert") {
      if (T.mode === "chain") chainInsert(c, k); else openInsert(c, k);
      if (T.auto && alpha() > threshold()) rehash(c, "Load factor α = " + alpha().toFixed(2) + " has passed the " + threshold() + " limit" + (T.mode === "chain" ? " (chains are getting long)" : " (probe sequences are getting long)") + ".");
    } else if (kind === "search") {
      if (T.mode === "chain") chainSearch(c, k); else openSearch(c, k);
    } else if (kind === "delete") {
      if (T.mode === "chain") chainDelete(c, k); else openDelete(c, k);
    } else if (kind === "rehash") {
      rehash(c, "Manual rehash requested.");
    }
    T.probesTotal += c.probes;
    T.opsTotal++;
    player.load(c.frames, true);
  }

  const fmtk = (k) => (typeof k === "number" ? k : '"' + k + '"');
  function parseKey(s) {
    s = String(s == null ? "" : s).trim();
    if (!s.length) return D.randInt(1, 99);
    return /^-?\d+$/.test(s) ? parseInt(s, 10) : s;
  }

  /* ---------------- rendering ---------------- */
  function render(f) {
    const view = q("table-view");
    view.innerHTML = "";
    if (!f.slots) return;

    if (f.mode === "chain") {
      const wrap = D.el("div", { style: "display:flex;flex-direction:column;gap:5px" });
      f.slots.forEach((chain, i) => {
        const row = D.el("div", { style: "display:flex;align-items:center;gap:6px" });
        row.appendChild(D.el("div", {
          class: "cell " + (f.marks[i] || "") + (chain.length ? " filled" : " empty"),
          text: i, style: "min-width:34px;height:32px;font-size:.76rem",
        }));
        row.appendChild(D.el("span", { class: "muted mono", text: chain.length ? "→" : "→ ∅", style: "font-size:.8rem" }));
        chain.forEach((k, j) => {
          const mk = f.chainMark && f.chainMark.b === i && f.chainMark.j === j ? f.chainMark.cls : "";
          row.appendChild(D.el("div", { class: "cell filled " + mk, text: fmtk(k), style: "min-width:44px;height:32px;font-size:.76rem" }));
          if (j < chain.length - 1) row.appendChild(D.el("span", { class: "muted mono", text: "→", style: "font-size:.8rem" }));
        });
        wrap.appendChild(row);
      });
      view.appendChild(wrap);
    } else {
      const row = D.el("div", { class: "cells" });
      f.slots.forEach((s, i) => {
        const empty = s === null;
        const tomb = s === TOMB;
        const c = D.el("div", {
          class: "cell " + (f.marks[i] || "") + (empty ? " empty" : " filled") + (tomb ? " visit" : ""),
          text: empty ? "·" : tomb ? TOMB : fmtk(s),
          style: "min-width:48px;height:42px;font-size:.78rem",
        });
        c.appendChild(D.el("span", { class: "idx", text: i }));
        row.appendChild(c);
      });
      const holder = D.el("div", { style: "padding:1.25rem 0 .4rem" });
      holder.appendChild(row);
      view.appendChild(holder);
    }

    q("t-n").textContent = f.n;
    q("t-m").textContent = f.m;
    if (q("t-m2")) q("t-m2").textContent = f.m;
    if (q("dh-q")) q("dh-q").textContent = secondary(f.m);
    q("t-alpha").textContent = f.alpha.toFixed(2);
    q("t-probes").textContent = f.probes;
    q("t-avg").textContent = T.opsTotal ? (T.probesTotal / T.opsTotal).toFixed(2) : "–";
    if (f.mode === "chain") {
      const lens = f.slots.map((s) => s.length);
      q("t-extra-k").textContent = "longest chain";
      q("t-extra").textContent = lens.length ? Math.max.apply(null, lens) : 0;
    } else {
      q("t-extra-k").textContent = "tombstones";
      q("t-extra").textContent = f.slots.filter((s) => s === TOMB).length;
    }
  }

  function still(note) { const c = Ctx(); c.snap({}, note); player.load(c.frames, false); }

  /* ---------------- init ---------------- */
  const MODES = {
    chain: {
      label: "Separate chaining",
      blurb: "Each slot holds a <b>list</b> of every key that hashes there, so collisions never fight over a slot and α " +
        "can safely exceed 1. Cost is 1 + α/2 comparisons for a successful search. The price is a pointer per node and " +
        "worse cache behaviour than open addressing.",
      formula: "index = h(k) mod m, then walk that bucket's list",
    },
    linear: {
      label: "Linear probing",
      blurb: "On a collision try the very next slot, wrapping around. Cache-friendly and simple, but it suffers from " +
        "<b>primary clustering</b>: occupied runs merge into longer runs, and once α approaches 1 the expected probe " +
        "count explodes as ½(1 + 1/(1−α)²).",
      formula: "index = (h(k) + i) mod m   for i = 0, 1, 2, …",
    },
    quad: {
      label: "Quadratic probing",
      blurb: "Jump i² slots away instead of i, which breaks up the long runs that linear probing creates. It trades " +
        "primary clustering for <b>secondary clustering</b> (keys with the same h(k) still follow the same path) and it " +
        "is only guaranteed to find a free slot when m is prime and α &lt; ½.",
      formula: "index = (h(k) + i²) mod m   for i = 0, 1, 2, …",
    },
    double: {
      label: "Double hashing",
      blurb: "The step size itself comes from a second hash, so two keys that collide at h(k) almost never share a probe " +
        "sequence — this removes both kinds of clustering and behaves closest to the uniform-hashing ideal. " +
        "h₂ must never return 0 and should be coprime with m; using a prime m and h₂(k) = q − (k mod q) guarantees it.",
      formula: "index = (h(k) + i·h₂(k)) mod m,  h₂(k) = q − (k mod q)",
    },
  };

  document.addEventListener("DOMContentLoaded", function () {
    player = new D.Player({ mount: "#player", render: render });

    D.Tabs("#tabs", Object.keys(MODES).map((id) => ({ id: id, label: MODES[id].label })), (id) => {
      const keys = [];
      T.slots.forEach((s) => { if (Array.isArray(s)) s.forEach((k) => keys.push(k)); else if (s !== null && s !== TOMB) keys.push(s); });
      T.mode = id;
      fresh(T.m);
      keys.forEach((k) => {
        if (id === "chain") { T.slots[h1(k, T.m)].unshift(k); T.n++; }
        else { for (let i = 0; i < T.m; i++) { const p = probeAt(k, i); if (T.slots[p] === null) { T.slots[p] = k; T.n++; break; } } }
      });
      q("mode-blurb").innerHTML = MODES[id].blurb;
      q("mode-formula").textContent = MODES[id].formula;
      q("dh-note").style.display = id === "double" ? "block" : "none";
      if (id === "double") q("dh-q").textContent = secondary(T.m);
      still("Switched to <b>" + MODES[id].label + "</b> and reinserted the " + keys.length + " existing key(s).");
    });

    q("op-insert").addEventListener("click", () => doOp("insert", parseKey(q("key").value)));
    q("op-search").addEventListener("click", () => doOp("search", parseKey(q("key").value)));
    q("op-delete").addEventListener("click", () => doOp("delete", parseKey(q("key").value)));
    q("op-rehash").addEventListener("click", () => doOp("rehash"));
    q("auto").addEventListener("change", (e) => { T.auto = e.target.checked; });
    q("msize").addEventListener("change", (e) => {
      const m = D.clamp(parseInt(e.target.value, 10) || 11, 3, 31);
      e.target.value = m;
      fresh(m);
      T.probesTotal = 0; T.opsTotal = 0;
      if (T.mode === "double") q("dh-q").textContent = secondary(m);
      still("New empty table with m = " + m + ". " + (isPrime(m) ? "m is prime — good." : "<b>m = " + m + " is not prime</b>; composite table sizes cluster badly, and quadratic probing / double hashing can fail to find free slots."));
    });
    q("op-fill").addEventListener("click", () => {
      const c = Ctx(2000);
      const vals = D.shuffled(D.randArray(Math.max(3, Math.round(T.m * 0.55)), 1, 99));
      fresh(T.m);
      c.snap({}, "Filling an empty table with " + vals.length + " random keys to α ≈ " + (vals.length / T.m).toFixed(2) + ".");
      vals.forEach((k) => { if (T.mode === "chain") chainInsert(c, k); else openInsert(c, k); });
      c.snap({}, "Done. Notice how the collisions " + (T.mode === "chain" ? "lengthen individual chains" : "push keys away from their home slot") + ".");
      player.load(c.frames, true);
    });
    q("op-clear").addEventListener("click", () => { fresh(T.m); T.probesTotal = 0; T.opsTotal = 0; still("Cleared."); });
    q("op-words").addEventListener("click", () => {
      const c = Ctx(2000);
      fresh(T.m);
      c.snap({}, "String keys use a <b>polynomial hash</b>: h = h·31 + charCode, which mixes both the letters and their positions.");
      ["cat", "dog", "bird", "fish", "ant", "bee"].forEach((k) => { if (T.mode === "chain") chainInsert(c, k); else openInsert(c, k); });
      player.load(c.frames, true);
    });

    D.legend("#legend", [
      { color: "var(--c-active)", label: "home slot / free slot found" },
      { color: "var(--c-cmp)", label: "occupied — collision, keep probing" },
      { color: "var(--c-visit)", label: "tombstone (deleted)" },
      { color: "var(--c-done)", label: "stored / found" },
      { color: "var(--c-swap)", label: "not found" },
    ]);

    fresh(11);
    [23, 45, 12, 34, 56].forEach((k) => { T.slots[h1(k, 11)].unshift(k); T.n++; });
    still("A chaining table with m = 11 and 5 keys. Try inserting keys that collide — e.g. 12 and 23 both land in bucket 1.");
  });
})();
