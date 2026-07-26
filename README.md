# DSA Visualizer — CSE 214 / CSE 373

Interactive data structure and algorithm visualizers. Pure static HTML/CSS/JS — no build step, no
dependencies, no framework. Drop it on GitHub Pages and it works.

**Live pages:** `index.html` → course picker → CSE 214 → eight modules.

## What's built

| Module | File | Contents |
|---|---|---|
| Arrays & Lists | `cse214/arrays.html` | dynamic array with capacity doubling + amortised-cost counters; singly & doubly linked lists with pointer-by-pointer splicing, search, reverse |
| Recursion | `cse214/recursion.html` | live call stack + recursion tree for factorial, naive Fibonacci, memoised Fibonacci (with memo table), Euclid's gcd, fast power, Towers of Hanoi (with pegs), binary search, permutations |
| Stacks, Queues & Deques | `cse214/stacks-queues.html` | array stack; circular-array queue with wrap-around demo; deque; balanced-bracket checker; postfix evaluator |
| Trees | `cse214/trees.html` | four traversals; BST insert/search/delete; AVL with all four rotation cases; (2,4)-trees; B-trees of order 3–7 — splits, transfers and fusions |
| Priority Queues | `cse214/priority-queues.html` | binary min/max heap shown as array *and* tree, up-heap, down-heap, bottom-up heapify vs build-by-insertion, heap-sort |
| Hash Tables | `cse214/hashtables.html` | separate chaining, linear probing, quadratic probing, double hashing; load factor, tombstones, rehashing; integer and string keys |
| Graphs | `cse214/graphs.html` | click-to-build graph editor (add/move/delete, directed toggle, 7 presets); BFS with live queue; DFS with live stack and discovery/finish times; DFS forest; synchronised adjacency matrix and list |
| Sorting | `cse214/sorting.html` | bubble, selection, insertion, heap, merge, quick, two-third and counting sort, with synchronised pseudocode and comparison/write counters |

CSE 373 (`cse373/index.html`) is a placeholder listing the planned modules.

## How it works

Every visualizer uses the same pattern, which lives in `assets/js/core.js`:

1. The algorithm runs **to completion** and records a *frame* at each interesting step
   (`DSA.Recorder`). A frame is a plain object: a snapshot of the data plus a caption.
2. A `DSA.Player` scrubs that frame list — play/pause, step forward *and back*, speed 0.35×–8×,
   drag the timeline anywhere.
3. A per-module `render(frame)` paints the current frame.

Recording up front (instead of animating live) is what makes stepping backwards and scrubbing
free. Keyboard: <kbd>space</kbd> play/pause, <kbd>←</kbd>/<kbd>→</kbd> step.

```
index.html              course picker
cse214/*.html           the eight modules
cse373/index.html       planned
assets/css/style.css    one stylesheet for everything
assets/js/core.js       player, recorder, DOM/SVG helpers, tabs, pseudocode panel
assets/js/*.js          one file per module
```

All paths are relative, so the site works from a repository subpath
(`username.github.io/repo/`) as well as from the domain root or a local `file://` open.

## Publishing to GitHub Pages

From this folder:

```sh
git init -b main
git add .
git commit -m "DSA visualizer: CSE 214 modules"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)` → Save**.
The site appears at `https://<you>.github.io/<repo>/` within a minute or two.

`.nojekyll` is included so GitHub serves the files as-is.

## Extending it

To add a visualizer:

1. Copy any `cse214/*.html` as a starting shell (topbar, `#stage`, `#player`, stats, legend).
2. Write `assets/js/yourmodule.js`:

```js
(function () {
  const D = window.DSA;
  const player = new D.Player({ mount: "#player", render: (f) => { /* paint f */ } });
  function run() {
    const R = new D.Recorder(4000);
    R.push({ note: "step one", /* ...state... */ });
    player.load(R.frames, true);
  }
})();
```

Reuse the shared state classes so colours mean the same thing everywhere: `active` (current),
`cmp` (comparing), `swap` (moving), `done` (settled), `visit` (seen), `target` (the answer).

## Testing

The modules were verified headlessly with a minimal DOM stub driving real button clicks:

- **BST / AVL** — 180 random insert/delete/search ops: BST ordering, stored heights, and AVL
  balance factors in {−1, 0, +1} after every operation, with an exact key-set check.
- **(2,4)-trees / B-trees** (m = 3…7) — 750 random ops: key counts per node within
  `[⌈m/2⌉−1, m−1]`, children = keys + 1, **all leaves at equal depth**, sorted in-order key
  sequence, exact key set.
- **Sorting** — all 8 algorithms verified sorted at n = 5/12/20/60 across random, sorted,
  reversed, nearly-sorted, few-unique and duplicate-heavy input.
- **Heaps** — heap order after every op for min and max heaps; both build strategies; heap-sort
  output ordering.
- **Hash tables** — all 4 strategies, 280 random ops: no lost keys, no duplicates, `n` exact
  across rehashes and tombstones.
- **Graphs** — BFS/DFS on all 7 presets, directed and undirected: no vertex visited twice, DFS
  forest reaches every vertex.
- **Recursion** — all 8 traces unwind to an empty stack with calls == returns.
