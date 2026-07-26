/* ============================================================
   trees.js — traversals, BST, AVL, (2,4)-trees and B-trees
   Binary structures use parent pointers so that a snapshot of
   the root is valid at any moment during rebalancing.
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);

  let nextId = 1;
  let player, mode = "trav";

  /* ---------------- binary nodes ---------------- */
  const bnode = (v) => ({ id: nextId++, v: v, left: null, right: null, p: null, h: 1 });
  const cloneB = (n) => (n ? { id: n.id, v: n.v, h: n.h, left: cloneB(n.left), right: cloneB(n.right) } : null);
  const hh = (n) => (n ? n.h : 0);
  const fixH = (n) => { if (n) n.h = 1 + Math.max(hh(n.left), hh(n.right)); };
  const bf = (n) => (n ? hh(n.left) - hh(n.right) : 0);

  /* ---------------- multiway nodes ---------------- */
  const mnode = (keys, kids) => ({ id: nextId++, keys: keys || [], kids: kids || [], p: null });
  const cloneM = (n) => (n ? { id: n.id, keys: n.keys.slice(), kids: n.kids.map(cloneM) } : null);

  /* ---------------- per-tab state ---------------- */
  const ST = {
    trav: { root: null },
    bst: { root: null },
    avl: { root: null },
    t24: { root: null, m: 4 },
    btree: { root: null, m: 5 },
  };

  /* ============================================================
     recorder
     ============================================================ */
  function Ctx(limit) {
    const R = new D.Recorder(limit || 900);
    return {
      cmp: 0, rot: 0, splits: 0, fusions: 0, transfers: 0,
      frames: R.frames,
      bin(st, marks, note, extra) {
        R.push(Object.assign({ kind: "bin", root: cloneB(st.root), marks: marks || {}, note: note, cmp: this.cmp, rot: this.rot }, extra || {}));
      },
      multi(st, marks, note, extra) {
        R.push(Object.assign({ kind: "multi", root: cloneM(st.root), m: st.m, marks: marks || {}, note: note, cmp: this.cmp, splits: this.splits, fusions: this.fusions, transfers: this.transfers }, extra || {}));
      },
    };
  }

  /* ============================================================
     BINARY SEARCH TREE
     ============================================================ */
  function bstFind(st, v, c, forInsert) {
    let n = st.root, path = [];
    while (n) {
      c.cmp++;
      path.push(n.id);
      const marks = {};
      path.forEach((id) => (marks[id] = "visit"));
      marks[n.id] = "active";
      if (v === n.v) { marks[n.id] = "done"; c.bin(st, marks, "Compare " + v + " with " + n.v + " — <b>equal, found it</b> after " + c.cmp + " comparison(s)."); return { node: n, path: path }; }
      const goLeft = v < n.v;
      c.bin(st, marks, "Compare " + v + " with " + n.v + ": " + v + " " + (goLeft ? "&lt;" : "&gt;") + " " + n.v + ", so it can only be in the <b>" + (goLeft ? "left" : "right") + "</b> subtree. Everything on the other side is discarded — that is the whole BST property.");
      if (!n[goLeft ? "left" : "right"]) return { node: null, parent: n, goLeft: goLeft, path: path };
      n = n[goLeft ? "left" : "right"];
    }
    return { node: null, parent: null, path: path };
  }

  function bstInsert(st, v, c, rebalance) {
    if (!st.root) {
      st.root = bnode(v);
      c.bin(st, { [st.root.id]: "done" }, "The tree was empty, so " + v + " becomes the <b>root</b>.");
      return;
    }
    c.bin(st, {}, "<b>insert(" + v + ")</b> — walk down from the root as if searching for " + v + ".");
    const r = bstFind(st, v, c);
    if (r.node) { c.bin(st, { [r.node.id]: "swap" }, v + " is already in the tree — a BST holds distinct keys, so nothing changes."); return; }
    const n = bnode(v);
    n.p = r.parent;
    r.parent[r.goLeft ? "left" : "right"] = n;
    c.bin(st, { [n.id]: "done", [r.parent.id]: "visit" }, "We fell off the tree at " + r.parent.v + "'s empty <b>" + (r.goLeft ? "left" : "right") + "</b> slot, so that is where " + v + " goes. A new key is always inserted as a <b>leaf</b>.");
    if (rebalance) avlRetrace(st, n.p, c, "insert");
    else {
      for (let a = n.p; a; a = a.p) fixH(a);
      c.bin(st, {}, "Plain BSTs never rebalance — so if you insert sorted data the tree degenerates into a linked list and search becomes O(n). Try inserting 1, 2, 3, 4, 5 in order.");
    }
  }

  function bstDelete(st, v, c, rebalance) {
    c.bin(st, {}, "<b>delete(" + v + ")</b> — first find it.");
    const r = bstFind(st, v, c);
    if (!r.node) { c.bin(st, {}, v + " is not in the tree — nothing to delete."); return; }
    let n = r.node;
    if (n.left && n.right) {
      c.bin(st, { [n.id]: "active" }, "Node " + n.v + " has <b>two children</b>, so it cannot simply be cut out. Replace its value with its <b>in-order successor</b>: the smallest key in the right subtree.");
      let s = n.right;
      while (s.left) {
        c.bin(st, { [n.id]: "active", [s.id]: "cmp" }, "Go left from " + s.v + " looking for the minimum of the right subtree.");
        s = s.left;
      }
      c.bin(st, { [n.id]: "active", [s.id]: "target" }, "<b>" + s.v + "</b> is the successor — it is the next key in sorted order, and it has no left child by construction.");
      n.v = s.v;
      c.bin(st, { [n.id]: "done", [s.id]: "swap" }, "Copy " + s.v + " up into the node we are deleting. Now the duplicate down at " + s.v + " has to go — but it has at most one child, so it is an easy case.");
      n = s;
    }
    const child = n.left || n.right;
    const par = n.p;
    if (child) child.p = par;
    if (!par) st.root = child;
    else if (par.left === n) par.left = child;
    else par.right = child;
    if (!rebalance) for (let a = par; a; a = a.p) fixH(a);
    c.bin(st, par ? { [par.id]: "visit" } : {}, child
      ? "Node " + n.v + " had <b>one child</b>, so promote that child into its place. The subtree stays a valid BST because all of it was already on the same side."
      : "Node " + n.v + " was a <b>leaf</b> — just detach it.");
    if (rebalance) avlRetrace(st, par, c, "delete");
  }

  /* ============================================================
     AVL rotations
     ============================================================ */
  function rotL(st, x, c) {
    const y = x.right;
    x.right = y.left; if (y.left) y.left.p = x;
    y.p = x.p;
    if (!x.p) st.root = y; else if (x.p.left === x) x.p.left = y; else x.p.right = y;
    y.left = x; x.p = y;
    fixH(x); fixH(y);
    c.rot++;
    return y;
  }
  function rotR(st, y, c) {
    const x = y.left;
    y.left = x.right; if (x.right) x.right.p = y;
    x.p = y.p;
    if (!y.p) st.root = x; else if (y.p.left === y) y.p.left = x; else y.p.right = x;
    x.right = y; y.p = x;
    fixH(y); fixH(x);
    c.rot++;
    return x;
  }

  function avlRetrace(st, from, c, why) {
    c.bin(st, from ? { [from.id]: "active" } : {}, "Now walk back up to the root, recomputing heights and checking the <b>balance factor</b> (height of left − height of right) at each ancestor.");
    let n = from;
    while (n) {
      const before = n.h;
      fixH(n);
      const b = bf(n);
      const marks = { [n.id]: Math.abs(b) > 1 ? "swap" : "cmp" };
      c.bin(st, marks, "At " + n.v + ": height " + (before !== n.h ? "changes to " : "stays ") + n.h + ", balance factor = " + hh(n.left) + " − " + hh(n.right) + " = <b>" + b + "</b>. " +
        (Math.abs(b) > 1 ? "That is outside {−1, 0, 1} — this node is <b>unbalanced</b> and must be rotated." : "Within {−1, 0, 1}, so this node is fine."));
      if (b > 1) {
        if (bf(n.left) < 0) {
          c.bin(st, { [n.id]: "swap", [n.left.id]: "active", [n.left.right.id]: "target" }, "<b>Left-Right case</b>: heavy on the left, but the left child leans right. A single rotation would not fix it — first rotate the <b>left child left</b>, turning this into a Left-Left case.");
          rotL(st, n.left, c);
          c.bin(st, { [n.id]: "swap" }, "Now it is Left-Left.");
        } else {
          c.bin(st, { [n.id]: "swap", [n.left.id]: "active" }, "<b>Left-Left case</b>: heavy on the left and the left child also leans left (or is balanced). One <b>right rotation</b> at " + n.v + " fixes it.");
        }
        n = rotR(st, n, c);
        c.bin(st, { [n.id]: "done" }, "Rotated: <b>" + n.v + "</b> is now the subtree root, its old parent became its right child. The subtree's height drops by one and the in-order sequence is unchanged — rotations never break the BST property.");
      } else if (b < -1) {
        if (bf(n.right) > 0) {
          c.bin(st, { [n.id]: "swap", [n.right.id]: "active", [n.right.left.id]: "target" }, "<b>Right-Left case</b>: heavy on the right, but the right child leans left. First rotate the <b>right child right</b> to turn this into Right-Right.");
          rotR(st, n.right, c);
          c.bin(st, { [n.id]: "swap" }, "Now it is Right-Right.");
        } else {
          c.bin(st, { [n.id]: "swap", [n.right.id]: "active" }, "<b>Right-Right case</b>: heavy on the right and the right child leans right. One <b>left rotation</b> at " + n.v + " fixes it.");
        }
        n = rotL(st, n, c);
        c.bin(st, { [n.id]: "done" }, "Rotated: <b>" + n.v + "</b> takes over the subtree. Height restored.");
      }
      n = n.p;
    }
    c.bin(st, {}, "Reached the root — every node is balanced again. " + (why === "insert"
      ? "An AVL insert needs <b>at most one</b> rotation (single or double), so it is O(log n) overall."
      : "An AVL delete may need a rotation at <b>every</b> level on the way up — still O(log n).") +
      " The height of an AVL tree with n nodes is at most 1.44·log₂n.");
  }

  /* ============================================================
     TRAVERSALS
     ============================================================ */
  function traverse(st, kind) {
    const c = Ctx(1200);
    const out = [];
    const seen = {};
    const marks = () => { const m = {}; Object.keys(seen).forEach((id) => (m[id] = seen[id])); return m; };
    const NAMES = { pre: "Pre-order (node, left, right)", in: "In-order (left, node, right)", post: "Post-order (left, right, node)", level: "Level-order (breadth-first)" };
    c.bin(st, {}, "<b>" + NAMES[kind] + "</b> on " + count(st.root) + " nodes.", { output: [] });
    if (!st.root) { c.bin(st, {}, "Empty tree.", { output: [] }); return c; }

    if (kind === "level") {
      const Q = [st.root];
      let level = 0, inLevel = 1;
      c.bin(st, { [st.root.id]: "cmp" }, "Level-order uses a <b>queue</b>, not recursion. Start by enqueueing the root.", { output: [], queue: [st.root.v] });
      while (Q.length) {
        const n = Q.shift();
        inLevel--;
        seen[n.id] = "done";
        out.push(n.v);
        const kids = [n.left, n.right].filter(Boolean);
        kids.forEach((k) => Q.push(k));
        c.bin(st, Object.assign(marks(), { [n.id]: "active" }), "Dequeue <b>" + n.v + "</b>, visit it, then enqueue its " + (kids.length ? kids.map((k) => k.v).join(" and ") : "(no) ") + " child" + (kids.length === 1 ? "" : "ren") + ". Nodes come out strictly level by level.",
          { output: out.slice(), queue: Q.map((x) => x.v) });
        if (inLevel === 0) { level++; inLevel = Q.length; }
      }
      c.bin(st, marks(), "Done: <b>" + out.join(" ") + "</b>. Level-order needs O(width) space — up to n/2 nodes for the bottom level of a complete tree.", { output: out.slice(), queue: [] });
      return c;
    }

    (function go(n, depth) {
      if (!n) return;
      seen[n.id] = "visit";
      c.bin(st, Object.assign(marks(), { [n.id]: "active" }), "Enter <b>" + n.v + "</b> (depth " + depth + ").", { output: out.slice() });
      if (kind === "pre") { out.push(n.v); seen[n.id] = "done"; c.bin(st, Object.assign(marks(), { [n.id]: "done" }), "<b>Visit " + n.v + " now</b> — pre-order outputs a node <em>before</em> its subtrees, which is why it can rebuild the exact shape of a tree.", { output: out.slice() }); }
      if (n.left) go(n.left, depth + 1); else if (kind === "in") c.bin(st, Object.assign(marks(), { [n.id]: "active" }), n.v + " has no left child, so there is nothing to do first.", { output: out.slice() });
      if (kind === "in") { out.push(n.v); seen[n.id] = "done"; c.bin(st, Object.assign(marks(), { [n.id]: "done" }), "<b>Visit " + n.v + " now</b> — the whole left subtree is done. On a BST, in-order output is <b>sorted</b>.", { output: out.slice() }); }
      if (n.right) go(n.right, depth + 1);
      if (kind === "post") { out.push(n.v); seen[n.id] = "done"; c.bin(st, Object.assign(marks(), { [n.id]: "done" }), "<b>Visit " + n.v + " now</b> — post-order waits for both subtrees, which is what you want for freeing memory or evaluating an expression tree.", { output: out.slice() }); }
      seen[n.id] = "done";
    })(st.root, 0);
    c.bin(st, marks(), "Done: <b>" + out.join(" ") + "</b>. Every node is entered and left exactly once, so all four traversals are <b>Θ(n)</b>; the recursive ones use O(h) stack space.", { output: out.slice() });
    return c;
  }

  /* ============================================================
     MULTIWAY: (2,4)-trees and B-trees
     ============================================================ */
  const maxKeys = (st) => st.m - 1;
  const minKeys = (st) => Math.ceil(st.m / 2) - 1;

  function mDescribe(st) {
    return st.m === 4
      ? "a <b>(2,4)-tree</b>: every internal node has 2, 3 or 4 children and 1, 2 or 3 keys"
      : "a <b>B-tree of order " + st.m + "</b>: up to " + st.m + " children and " + (st.m - 1) + " keys per node, at least " + minKeys(st) + " keys in every non-root node";
  }

  function mFind(st, k, c) {
    let n = st.root, depth = 0;
    while (n) {
      let i = 0;
      while (i < n.keys.length && k > n.keys[i]) {
        c.cmp++;
        c.multi(st, { [n.id]: "active" }, "At this node scan the keys left to right: " + k + " &gt; " + n.keys[i] + ", keep scanning.", { keyMark: { node: n.id, i: i, cls: "cmp" } });
        i++;
      }
      c.cmp++;
      if (i < n.keys.length && k === n.keys[i]) {
        c.multi(st, { [n.id]: "done" }, "<b>Found " + k + "</b> at depth " + depth + " after " + c.cmp + " key comparison(s).", { keyMark: { node: n.id, i: i, cls: "done" } });
        return { node: n, i: i };
      }
      if (!n.kids.length) {
        c.multi(st, { [n.id]: "swap" }, "This is a <b>leaf</b> and " + k + " is not in it — so " + k + " is not in the tree. Every search path ends at a leaf, and all leaves are at the <b>same depth</b>.");
        return { node: null, leaf: n, i: i };
      }
      c.multi(st, { [n.id]: "visit" }, i < n.keys.length
        ? "" + k + " &lt; " + n.keys[i] + ", so follow child " + i + " — the subtree holding keys between " + (i ? n.keys[i - 1] : "−∞") + " and " + n.keys[i] + "."
        : "" + k + " is greater than every key here, so follow the <b>rightmost</b> child.");
      n = n.kids[i];
      depth++;
    }
    return { node: null, leaf: null };
  }

  function mSplit(st, n, c) {
    const mid = Math.floor(n.keys.length / 2);
    const up = n.keys[mid];
    const right = mnode(n.keys.slice(mid + 1), n.kids.slice(mid + 1));
    right.kids.forEach((kd) => (kd.p = right));
    n.keys = n.keys.slice(0, mid);
    n.kids = n.kids.slice(0, mid + 1);
    c.splits++;
    if (!n.p) {
      const nr = mnode([up], [n, right]);
      n.p = nr; right.p = nr;
      st.root = nr;
      c.multi(st, { [nr.id]: "done", [n.id]: "cmp", [right.id]: "cmp" }, "<b>Split the root.</b> The middle key <b>" + up + "</b> becomes a brand-new root with the two halves as its children — this is the <em>only</em> way a B-tree grows taller, and it grows at the top, which is why all leaves stay at the same depth.");
    } else {
      const p = n.p;
      const idx = p.kids.indexOf(n);
      p.keys.splice(idx, 0, up);
      p.kids.splice(idx + 1, 0, right);
      right.p = p;
      c.multi(st, { [p.id]: "active", [n.id]: "cmp", [right.id]: "cmp" }, "<b>Split.</b> The node overflowed, so keep the left half here, put the right half in a new sibling, and push the middle key <b>" + up + "</b> up into the parent. The parent may now overflow too — splits cascade upward.", { keyMark: { node: p.id, i: idx, cls: "done" } });
      if (p.keys.length > maxKeys(st)) mSplit(st, p, c);
    }
  }

  function mInsert(st, k, c) {
    if (!st.root) {
      st.root = mnode([k]);
      c.multi(st, { [st.root.id]: "done" }, "Empty tree — " + k + " becomes the root, which is also the only leaf.");
      return;
    }
    c.multi(st, {}, "<b>insert(" + k + ")</b> into " + mDescribe(st) + ". Insertion always happens in a <b>leaf</b>; find it first.");
    const f = mFind(st, k, c);
    if (f.node) { c.multi(st, { [f.node.id]: "swap" }, k + " is already present — duplicates are not stored."); return; }
    const leaf = f.leaf;
    let i = 0;
    while (i < leaf.keys.length && leaf.keys[i] < k) i++;
    leaf.keys.splice(i, 0, k);
    c.multi(st, { [leaf.id]: "done" }, "Insert " + k + " into the leaf in sorted position. The leaf now has " + leaf.keys.length + " key(s); the limit is " + maxKeys(st) + ".", { keyMark: { node: leaf.id, i: i, cls: "done" } });
    if (leaf.keys.length > maxKeys(st)) {
      c.multi(st, { [leaf.id]: "swap" }, "<b>Overflow!</b> " + leaf.keys.length + " keys is one too many, so this node must <b>split</b>.");
      mSplit(st, leaf, c);
    }
    c.multi(st, {}, "Insert complete. Height is " + mHeight(st.root) + ", and every leaf is still at exactly that depth — a B-tree is <b>perfectly height-balanced by construction</b>. Cost O(log n).");
  }

  function mDelete(st, k, c) {
    c.multi(st, {}, "<b>delete(" + k + ")</b> — find the key first.");
    const f = mFind(st, k, c);
    if (!f.node) return;
    let n = f.node, i = f.i;
    if (n.kids.length) {
      c.multi(st, { [n.id]: "active" }, k + " sits in an <b>internal</b> node, and internal keys are separators — removing one directly would leave a gap between two subtrees. So swap it with its <b>in-order predecessor</b>, which always lives in a leaf.", { keyMark: { node: n.id, i: i, cls: "cmp" } });
      let p = n.kids[i];
      while (p.kids.length) { c.multi(st, { [n.id]: "active", [p.id]: "visit" }, "Walk down the rightmost path of the left subtree."); p = p.kids[p.kids.length - 1]; }
      const pred = p.keys[p.keys.length - 1];
      c.multi(st, { [n.id]: "active", [p.id]: "target" }, "The predecessor is <b>" + pred + "</b> — the largest key smaller than " + k + ".", { keyMark: { node: p.id, i: p.keys.length - 1, cls: "target" } });
      n.keys[i] = pred;
      p.keys.pop();
      c.multi(st, { [n.id]: "done", [p.id]: "cmp" }, "Move " + pred + " up into the separator slot and delete it from the leaf. The problem is now always \"a key was removed from a leaf\".");
      n = p;
    } else {
      n.keys.splice(i, 1);
      c.multi(st, { [n.id]: "cmp" }, "It is in a leaf — remove it directly. The leaf now has " + n.keys.length + " key(s); the minimum is " + minKeys(st) + ".");
    }
    mFix(st, n, c);
    c.multi(st, {}, "Delete complete. Height " + mHeight(st.root) + ". O(log n), with at most one transfer-or-fusion per level.");
  }

  function mFix(st, n, c) {
    if (!n.p) {
      if (n.keys.length === 0) {
        if (n.kids.length) {
          st.root = n.kids[0];
          st.root.p = null;
          c.multi(st, { [st.root.id]: "done" }, "The <b>root</b> ran out of keys, so its only child becomes the new root and the tree gets <b>one level shorter</b>. This is the mirror image of a root split.");
        } else { st.root = null; c.multi(st, {}, "The last key is gone — the tree is empty."); }
      }
      return;
    }
    if (n.keys.length >= minKeys(st)) {
      c.multi(st, { [n.id]: "done" }, "This node still has " + n.keys.length + " key(s) ≥ the minimum " + minKeys(st) + ", so nothing else needs fixing.");
      return;
    }
    c.multi(st, { [n.id]: "swap" }, "<b>Underflow!</b> This node has " + n.keys.length + " key(s), below the minimum of " + minKeys(st) + ". Look at its immediate siblings for help.");
    const p = n.p, idx = p.kids.indexOf(n);
    const ls = idx > 0 ? p.kids[idx - 1] : null;
    const rs = idx < p.kids.length - 1 ? p.kids[idx + 1] : null;

    if (ls && ls.keys.length > minKeys(st)) {
      c.transfers++;
      c.multi(st, { [n.id]: "swap", [ls.id]: "active", [p.id]: "cmp" }, "The <b>left sibling</b> has " + ls.keys.length + " keys — one to spare. Do a <b>transfer</b> (a rotation through the parent): the parent's separator comes down into this node, and the sibling's largest key goes up to replace it.", { keyMark: { node: p.id, i: idx - 1, cls: "target" } });
      n.keys.unshift(p.keys[idx - 1]);
      p.keys[idx - 1] = ls.keys.pop();
      if (ls.kids.length) { const kd = ls.kids.pop(); kd.p = n; n.kids.unshift(kd); }
      c.multi(st, { [n.id]: "done", [ls.id]: "cmp", [p.id]: "cmp" }, "Transfer done — order is preserved because the borrowed key was the closest one on that side. No further fixing needed: the sibling still meets its minimum.");
      return;
    }
    if (rs && rs.keys.length > minKeys(st)) {
      c.transfers++;
      c.multi(st, { [n.id]: "swap", [rs.id]: "active", [p.id]: "cmp" }, "The <b>right sibling</b> has " + rs.keys.length + " keys — one to spare. <b>Transfer</b> through the parent from the right.", { keyMark: { node: p.id, i: idx, cls: "target" } });
      n.keys.push(p.keys[idx]);
      p.keys[idx] = rs.keys.shift();
      if (rs.kids.length) { const kd = rs.kids.shift(); kd.p = n; n.kids.push(kd); }
      c.multi(st, { [n.id]: "done", [rs.id]: "cmp", [p.id]: "cmp" }, "Transfer done.");
      return;
    }

    /* fusion */
    c.fusions++;
    const left = ls || n, right = ls ? n : rs, sepIdx = ls ? idx - 1 : idx;
    c.multi(st, { [left.id]: "active", [right.id]: "active", [p.id]: "cmp" }, "Both siblings are at their minimum, so nobody can lend a key. Instead <b>fuse</b> (merge): the two nodes plus the parent's separator key <b>" + p.keys[sepIdx] + "</b> become one node.", { keyMark: { node: p.id, i: sepIdx, cls: "target" } });
    left.keys = left.keys.concat([p.keys[sepIdx]], right.keys);
    right.kids.forEach((kd) => { kd.p = left; left.kids.push(kd); });
    p.keys.splice(sepIdx, 1);
    p.kids.splice(p.kids.indexOf(right), 1);
    c.multi(st, { [left.id]: "done", [p.id]: "cmp" }, "Fused into a single node with " + left.keys.length + " key(s). The parent lost a key, so it may now underflow itself — fusions <b>cascade upward</b>, and if they reach the root the tree shrinks by a level.");
    mFix(st, p, c);
  }

  function mHeight(n) { let h = 0; while (n && n.kids.length) { h++; n = n.kids[0]; } return h; }
  function mCount(n) { return n ? n.keys.length + n.kids.reduce((s, k) => s + mCount(k), 0) : 0; }
  function mNodes(n) { return n ? 1 + n.kids.reduce((s, k) => s + mNodes(k), 0) : 0; }

  /* ============================================================
     RENDERING
     ============================================================ */
  function count(n) { return n ? 1 + count(n.left) + count(n.right) : 0; }
  function height(n) { return n ? 1 + Math.max(height(n.left), height(n.right)) : 0; }

  function renderBinary(f) {
    const root = f.root;
    const n = count(root);
    const gapX = n > 18 ? 34 : n > 12 ? 42 : 52;
    const geo = D.layoutBinary(root, { gapX: gapX, gapY: 66, padX: 30, padY: 34 });
    const W = Math.max(320, geo.width), Hh = Math.max(120, geo.height);
    const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + W + " " + Hh, width: W, height: Hh });
    const rr = 16;
    (function edges(nd) {
      if (!nd) return;
      [nd.left, nd.right].forEach((k) => {
        if (!k) return;
        svg.appendChild(D.sLine(nd._x, nd._y + rr, k._x, k._y - rr, "edge " + (f.marks[k.id] === "done" || f.marks[nd.id] === "done" ? "" : "")));
        edges(k);
      });
    })(root);
    (function nodes(nd) {
      if (!nd) return;
      const cls = f.marks[nd.id] || "";
      const g = D.svg("g", {});
      g.appendChild(D.svg("circle", { cx: nd._x, cy: nd._y, r: rr, class: "node-c " + cls }));
      g.appendChild(D.sText(nd._x, nd._y, nd.v, { "font-size": String(nd.v).length > 2 ? 10 : 12 }));
      if (mode === "avl") {
        const b = (nd.left ? nd.left.h : 0) - (nd.right ? nd.right.h : 0);
        g.appendChild(D.sText(nd._x + rr + 13, nd._y - 6, "h" + nd.h, { class: "lbl-s", "font-size": 9 }));
        g.appendChild(D.sText(nd._x + rr + 13, nd._y + 6, (b > 0 ? "+" : "") + b, { class: "lbl-s", "font-size": 9, fill: Math.abs(b) > 1 ? "#ff6b9d" : "#6b7997" }));
      }
      svg.appendChild(g);
      nodes(nd.left); nodes(nd.right);
    })(root);
    if (!root) svg.appendChild(D.sText(W / 2, 50, "empty tree", { class: "lbl-s", "font-size": 13 }));
    return { svg: svg, nodes: n, height: height(root) };
  }

  function layoutMulti(root) {
    const gapY = 74, sep = 22, keyW = 30, pad = 18;
    let maxD = 0, right = 0;
    const wOf = (nd) => nd.keys.length * keyW + 12;
    (function walk(nd, depth, xLeft) {
      maxD = Math.max(maxD, depth);
      nd._y = 30 + depth * gapY;
      nd._w = wOf(nd);
      if (!nd.kids.length) { nd._x = xLeft + nd._w / 2; right = Math.max(right, xLeft + nd._w); return nd._w; }
      let x = xLeft, total = 0;
      nd.kids.forEach((k) => { const w = walk(k, depth + 1, x); x += w + sep; total += w + sep; });
      total -= sep;
      nd._x = (nd.kids[0]._x + nd.kids[nd.kids.length - 1]._x) / 2;
      right = Math.max(right, xLeft + Math.max(total, nd._w));
      return Math.max(total, nd._w);
    })(root, 0, pad);
    return { width: right + pad, height: 30 + (maxD + 1) * gapY + 10 };
  }

  function renderMulti(f) {
    const root = f.root;
    if (!root) {
      const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 320 90", width: 320, height: 90 });
      svg.appendChild(D.sText(160, 45, "empty tree", { class: "lbl-s", "font-size": 13 }));
      return { svg: svg, nodes: 0, height: 0, keys: 0 };
    }
    const geo = layoutMulti(root);
    const W = Math.max(340, geo.width), Hh = Math.max(120, geo.height);
    const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + W + " " + Hh, width: W, height: Hh });
    const NH = 30, keyW = 30;
    (function edges(nd) {
      nd.kids.forEach((k, i) => {
        const x = nd._x - nd._w / 2 + (i / nd.kids.length) * nd._w + nd._w / (2 * nd.kids.length);
        svg.appendChild(D.sLine(x, nd._y + NH / 2, k._x, k._y - NH / 2, "edge"));
        edges(k);
      });
    })(root);
    (function nodes(nd) {
      const cls = f.marks[nd.id] || "";
      const x0 = nd._x - nd._w / 2;
      svg.appendChild(D.svg("rect", { x: x0, y: nd._y - NH / 2, width: nd._w, height: NH, rx: 6, class: "node-c " + cls }));
      nd.keys.forEach((k, i) => {
        const kx = x0 + 6 + i * keyW + keyW / 2;
        if (i > 0) svg.appendChild(D.sLine(x0 + 6 + i * keyW, nd._y - NH / 2 + 3, x0 + 6 + i * keyW, nd._y + NH / 2 - 3, "edge dim"));
        const km = f.keyMark && f.keyMark.node === nd.id && f.keyMark.i === i ? f.keyMark.cls : null;
        if (km) svg.appendChild(D.svg("rect", { x: kx - keyW / 2 + 1, y: nd._y - NH / 2 + 2, width: keyW - 2, height: NH - 4, rx: 4, fill: km === "done" ? "#4ade8033" : km === "target" ? "#22d3ee33" : "#ffc14d33" }));
        svg.appendChild(D.sText(kx, nd._y, k, { "font-size": String(k).length > 2 ? 10 : 12 }));
      });
      nd.kids.forEach(nodes);
    })(root);
    return { svg: svg, nodes: mNodes(root), height: mHeight(root), keys: mCount(root) };
  }

  function render(f) {
    const stage = q("tree-view");
    stage.innerHTML = "";
    if (!f.kind) { stage.appendChild(D.el("p", { class: "small muted", text: "Run an operation." })); return; }
    const out = f.kind === "bin" ? renderBinary(f) : renderMulti(f);
    stage.appendChild(out.svg);

    q("t-nodes").textContent = out.nodes;
    q("t-height").textContent = f.kind === "bin" ? Math.max(0, out.height - 1) : out.height;
    q("t-cmp").textContent = f.cmp == null ? "–" : f.cmp;
    if (f.kind === "bin") {
      q("t-extra-k").textContent = "rotations";
      q("t-extra").textContent = f.rot == null ? "–" : f.rot;
      q("t-extra2-k").textContent = "min possible height";
      q("t-extra2").textContent = out.nodes ? Math.floor(Math.log2(out.nodes)) : 0;
    } else {
      q("t-extra-k").textContent = "splits / fusions";
      q("t-extra").textContent = (f.splits || 0) + " / " + (f.fusions || 0);
      q("t-extra2-k").textContent = "keys / transfers";
      q("t-extra2").textContent = out.keys + " / " + (f.transfers || 0);
    }

    /* traversal output + queue */
    const ov = q("output");
    ov.innerHTML = "";
    if (f.output) {
      ov.appendChild(D.el("div", { class: "small muted", text: "visit order", style: "margin-bottom:.3rem" }));
      const row = D.el("div", { class: "cells" });
      f.output.forEach((v) => row.appendChild(D.el("div", { class: "cell filled done", text: v, style: "min-width:36px;height:30px;font-size:.76rem" })));
      ov.appendChild(f.output.length ? row : D.el("span", { class: "small muted", text: "(nothing yet)" }));
      if (f.queue) {
        ov.appendChild(D.el("div", { class: "small muted", text: "queue", style: "margin:.6rem 0 .3rem" }));
        const qr = D.el("div", { class: "cells" });
        f.queue.forEach((v) => qr.appendChild(D.el("div", { class: "cell filled cmp", text: v, style: "min-width:36px;height:30px;font-size:.76rem" })));
        ov.appendChild(f.queue.length ? qr : D.el("span", { class: "small muted", text: "(empty)" }));
      }
    }
  }

  /* ============================================================
     wiring
     ============================================================ */
  const BLURB = {
    trav:
      "All four traversals do the same Θ(n) walk — they differ only in <em>when</em> a node is reported. Pre-order " +
      "reports on the way in, in-order between the two subtrees, post-order on the way out, and level-order abandons " +
      "recursion for a queue. On a BST, in-order is the sorted sequence.",
    bst:
      "A binary search tree keeps every key in the left subtree smaller and every key in the right subtree larger. " +
      "That makes search, insert and delete <b>O(h)</b> — which is O(log n) for a bushy tree but <b>O(n)</b> for a " +
      "degenerate one. Nothing in the BST rules prevents degeneracy, which is the entire motivation for AVL trees.",
    avl:
      "An AVL tree is a BST that additionally keeps every node's balance factor in {−1, 0, +1}. Any insert or delete " +
      "that breaks this is repaired by one or two <b>rotations</b>, which preserve in-order sequence while reducing " +
      "height. Height stays ≤ 1.44·log₂n, so every operation is guaranteed O(log n).",
    t24:
      "A (2,4)-tree stores 1–3 keys per node and keeps <b>every leaf at the same depth</b>. Overflow on insert is fixed " +
      "by a <b>split</b> that pushes the middle key up; underflow on delete is fixed by a <b>transfer</b> from a sibling " +
      "or a <b>fusion</b> with one. Height is between log₄n and log₂n, so operations are O(log n) with no rotations at all.",
    btree:
      "A B-tree is the same idea with a bigger fan-out, chosen so one node fills one disk block or memory page. With " +
      "order 100 a tree of a million keys is only 3 levels deep, so a lookup costs 3 block reads. This is why every " +
      "database index and filesystem in the world is a B-tree or B⁺-tree.",
  };

  document.addEventListener("DOMContentLoaded", function () {
    player = new D.Player({ mount: "#player", render: render, delay: 660 });
    const PANELS = ["tools-trav", "tools-bst", "tools-avl", "tools-t24", "tools-btree"];
    const st = () => ST[mode];
    const val = () => { const v = parseInt(q("val").value, 10); return isNaN(v) ? D.randInt(1, 99) : v; };
    const show = (c) => player.load(c.frames, true);

    function still(note) {
      const c = Ctx();
      if (mode === "t24" || mode === "btree") c.multi(st(), {}, note);
      else c.bin(st(), {}, note);
      player.load(c.frames, false);
    }

    function buildBinary(target, vals, balanced) {
      const s = ST[target];
      s.root = null;
      const c = Ctx(6000);
      vals.forEach((v) => bstInsert(s, v, c, balanced));
      return c;
    }

    D.Tabs("#tabs", [
      { id: "trav", label: "Traversals" },
      { id: "bst", label: "Binary Search Tree" },
      { id: "avl", label: "AVL (balanced)" },
      { id: "t24", label: "(2,4)-Tree" },
      { id: "btree", label: "B-Tree" },
    ], (id) => {
      mode = id;
      PANELS.forEach((p) => (q(p).style.display = "none"));
      q("tools-" + id).style.display = "flex";
      q("blurb").innerHTML = BLURB[id];
      q("bt-order-wrap").style.display = id === "btree" ? "flex" : "none";
      still("Showing the <b>" + (id === "trav" ? "traversal" : id === "bst" ? "BST" : id === "avl" ? "AVL" : id === "t24" ? "(2,4)" : "B-tree") + "</b> demo.");
    });

    /* ---- traversals ---- */
    ["pre", "in", "post", "level"].forEach((k) =>
      q("tr-" + k).addEventListener("click", () => {
        if (!ST.trav.root) return D.toast("Build a tree first.", true);
        show(traverse(ST.trav, k));
      })
    );
    q("tr-rand").addEventListener("click", () => {
      const vals = D.shuffled(D.randArray(9, 10, 99).filter((v, i, a) => a.indexOf(v) === i));
      ST.trav.root = null;
      const c = Ctx(4000);
      vals.forEach((v) => bstInsert(ST.trav, v, c, false));
      still("Built a random BST with " + count(ST.trav.root) + " nodes. Pick a traversal.");
    });
    q("tr-perfect").addEventListener("click", () => {
      ST.trav.root = null;
      const c = Ctx(4000);
      [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43, 56, 68, 81, 93].forEach((v) => bstInsert(ST.trav, v, c, false));
      still("A <b>perfect</b> BST of 15 nodes, height 3. In-order will come out sorted; level-order reads it row by row.");
    });
    q("tr-load").addEventListener("click", () => {
      const vals = D.parseNums(q("tr-vals").value).slice(0, 24);
      if (!vals.length) return D.toast("Enter some numbers.", true);
      ST.trav.root = null;
      const c = Ctx(4000);
      vals.forEach((v) => bstInsert(ST.trav, v, c, false));
      still("Inserted " + vals.length + " values in the order you gave them.");
    });

    /* ---- BST / AVL shared ops ---- */
    [["bst", false], ["avl", true]].forEach(function (pair) {
      const pre = pair[0], bal = pair[1];
      q(pre + "-insert").addEventListener("click", () => { const c = Ctx(1500); bstInsert(ST[pre], val(), c, bal); show(c); });
      q(pre + "-search").addEventListener("click", () => {
        const c = Ctx(1000), v = val();
        c.bin(ST[pre], {}, "<b>search(" + v + ")</b> — start at the root.");
        if (!ST[pre].root) c.bin(ST[pre], {}, "The tree is empty.");
        else { const r = bstFind(ST[pre], v, c); if (!r.node) c.bin(ST[pre], {}, "We ran off the bottom of the tree, so <b>" + v + " is not present</b>. Cost was " + c.cmp + " comparison(s) — one per level."); }
        show(c);
      });
      q(pre + "-delete").addEventListener("click", () => { const c = Ctx(1500); bstDelete(ST[pre], val(), c, bal); show(c); });
      q(pre + "-rand").addEventListener("click", () => {
        const vals = D.randArray(9, 10, 99).filter((v, i, a) => a.indexOf(v) === i);
        show(buildBinary(pre, vals, bal));
      });
      q(pre + "-clear").addEventListener("click", () => { ST[pre].root = null; still("Cleared."); });
    });
    q("bst-degenerate").addEventListener("click", () => {
      show(buildBinary("bst", [10, 20, 30, 40, 50, 60], false));
      D.toast("Sorted input → a linked list. Search is now O(n).");
    });
    q("avl-degenerate").addEventListener("click", () => {
      show(buildBinary("avl", [10, 20, 30, 40, 50, 60], true));
      D.toast("Same sorted input — rotations keep it O(log n).");
    });

    /* ---- multiway ops ---- */
    [["t24", 4], ["btree", 5]].forEach(function (pair) {
      const pre = pair[0];
      q(pre + "-insert").addEventListener("click", () => { const c = Ctx(1500); mInsert(ST[pre], val(), c); show(c); });
      q(pre + "-search").addEventListener("click", () => {
        const c = Ctx(1000), v = val();
        if (!ST[pre].root) { c.multi(ST[pre], {}, "The tree is empty."); }
        else { c.multi(ST[pre], {}, "<b>search(" + v + ")</b> — at each node scan its keys, then drop into the right child."); mFind(ST[pre], v, c); }
        show(c);
      });
      q(pre + "-delete").addEventListener("click", () => { const c = Ctx(1800); mDelete(ST[pre], val(), c); show(c); });
      q(pre + "-rand").addEventListener("click", () => {
        const vals = D.shuffled(D.randArray(14, 1, 99).filter((v, i, a) => a.indexOf(v) === i));
        ST[pre].root = null;
        const c = Ctx(8000);
        vals.forEach((v) => mInsert(ST[pre], v, c));
        still("Inserted " + vals.length + " random keys. Height " + mHeight(ST[pre].root) + " — every leaf at the same depth.");
      });
      q(pre + "-seq").addEventListener("click", () => {
        ST[pre].root = null;
        const c = Ctx(8000);
        for (let v = 1; v <= 12; v++) mInsert(ST[pre], v, c);
        show(c);
        D.toast("Sorted input is fine here — splits keep it balanced.");
      });
      q(pre + "-clear").addEventListener("click", () => { ST[pre].root = null; still("Cleared."); });
    });
    q("bt-order").addEventListener("change", (e) => {
      const m = D.clamp(parseInt(e.target.value, 10) || 5, 3, 7);
      e.target.value = m;
      ST.btree.m = m;
      ST.btree.root = null;
      still("Rebuilt as an empty B-tree of order " + m + ": up to " + m + " children, " + (m - 1) + " keys per node, minimum " + (Math.ceil(m / 2) - 1) + " keys outside the root.");
    });

    D.legend("#legend", [
      { color: "var(--c-active)", label: "current node" },
      { color: "var(--c-cmp)", label: "compared / on the path" },
      { color: "var(--c-visit)", label: "already passed through" },
      { color: "var(--c-swap)", label: "problem here (unbalanced / overflow / underflow)" },
      { color: "var(--c-target)", label: "successor / separator key" },
      { color: "var(--c-done)", label: "settled" },
    ]);

    /* seed all five */
    let c0 = Ctx(9000);
    [50, 25, 75, 12, 37, 62, 87].forEach((v) => bstInsert(ST.trav, v, c0, false));
    [50, 30, 70, 20, 40, 60, 80].forEach((v) => bstInsert(ST.bst, v, c0, false));
    [50, 30, 70, 20, 40, 60, 80, 10].forEach((v) => bstInsert(ST.avl, v, c0, true));
    [10, 20, 30, 40, 50, 60, 70].forEach((v) => mInsert(ST.t24, v, c0));
    [5, 10, 15, 20, 25, 30, 35, 40, 45].forEach((v) => mInsert(ST.btree, v, c0));
    still("A BST of 7 nodes. Pick a traversal to see how the four orders differ.");
  });
})();
