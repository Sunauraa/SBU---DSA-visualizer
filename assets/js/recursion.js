/* ============================================================
   recursion.js — call stack + recursion tree for eight
   recursive functions. Each function is written normally and
   just reports what it is doing to a tracer `t`.
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);

  /* =======================================================
     tracer
     ======================================================= */
  function Tracer(limit) {
    this.nodes = [];        /* {id, parent, label, depth, children, ret} */
    this.frames = [];
    this.stack = [];        /* ids, innermost last */
    this.limit = limit || 1200;
    this.calls = 0;
    this.maxDepth = 0;
    this.returns = 0;
    this.view = null;       /* optional side view carried into frames */
    this.line = null;       /* pseudocode line the trace is sitting on */
  }
  /** Point the code panel at pseudocode line n for the frames that follow. */
  Tracer.prototype.at = function (n) { this.line = n; return this; };
  Tracer.prototype._states = function () {
    const s = {};
    this.nodes.forEach((n) => (s[n.id] = n.ret === undefined ? "open" : "done"));
    this.stack.forEach((id) => (s[id] = "open"));
    if (this.stack.length) s[this.stack[this.stack.length - 1]] = "active";
    return s;
  };
  Tracer.prototype.frame = function (note, extra) {
    if (this.frames.length >= this.limit) { this.over = true; return; }
    this.frames.push(
      Object.assign(
        {
          created: this.nodes.length,
          states: this._states(),
          stack: this.stack.slice(),
          cur: this.stack.length ? this.stack[this.stack.length - 1] : null,
          calls: this.calls,
          depth: this.stack.length,
          maxDepth: this.maxDepth,
          returns: this.returns,
          note: note,
          line: this.line,
          view: this.view ? JSON.parse(JSON.stringify(this.view)) : null,
        },
        extra || {}
      )
    );
  };
  Tracer.prototype.enter = function (label, note) {
    const parent = this.stack.length ? this.stack[this.stack.length - 1] : null;
    const n = { id: this.nodes.length, parent: parent, label: label, depth: this.stack.length, children: [], ret: undefined };
    this.nodes.push(n);
    if (parent !== null) this.nodes[parent].children.push(n);
    this.stack.push(n.id);
    this.calls++;
    this.maxDepth = Math.max(this.maxDepth, this.stack.length);
    this.frame(
      note ||
        "<b>Call " + label + "</b> — a new frame is pushed onto the call stack (depth " + this.stack.length + ")."
    );
    return n.id;
  };
  Tracer.prototype.step = function (note, extra) { this.frame(note, extra); };
  Tracer.prototype.exit = function (id, val, note) {
    this.nodes[id].ret = val;
    this.returns++;
    this.frame(note || "<b>" + this.nodes[id].label + " returns " + fmt(val) + "</b> — its frame is popped and control goes back to the caller.");
    this.stack.pop();
    return val;
  };
  const fmt = (v) => (Array.isArray(v) ? "[" + v.join(", ") + "]" : String(v));

  /* =======================================================
     the recursive functions
     ======================================================= */
  const FN = {};

  FN.factorial = {
    label: "factorial(n)",
    inputs: [{ id: "n", label: "n", value: 5, min: 0, max: 9 }],
    big: ["T(n) = T(n−1) + O(1)", "Θ(n) time", "Θ(n) stack"],
    blurb:
      "The simplest shape of recursion: one call per level, so the tree is a straight chain and the stack grows to " +
      "depth n. Notice that nothing is computed on the way <em>down</em> — every multiplication happens as the " +
      "frames pop back up.",
    code: {
      pseudo: [
        "factorial(n):",
        "  if n ≤ 1: return 1        // base case",
        "  return n · factorial(n-1) // recursive case",
      ],
      java: [
        "static int factorial(int n) {",
        "  if (n <= 1) return 1;        // base case",
        "  return n * factorial(n - 1); // recursive case",
        "}",
      ],
      cpp: [
        "int factorial(int n) {",
        "  if (n <= 1) return 1;        // base case",
        "  return n * factorial(n - 1); // recursive case",
        "}",
      ],
      python: [
        "def factorial(n):",
        "  if n <= 1:",
        "    return 1                 # base case",
        "  return n * factorial(n - 1)  # recursive case",
      ],
      map: { python: [0, 2, 3] },
    },
    run(t, args) {
      (function f(n) {
        const id = t.at(0).enter("factorial(" + n + ")");
        if (n <= 1) return t.at(1).exit(id, 1, "<b>Base case</b> reached: n = " + n + " ≤ 1, so return 1 immediately without recursing. Without this the recursion would never stop.");
        t.at(2).step("n = " + n + " &gt; 1, so this frame is <em>blocked</em> until factorial(" + (n - 1) + ") gives it an answer.");
        const sub = f(n - 1);
        t.at(2).step("Back in factorial(" + n + "): the sub-call returned " + sub + ", so compute " + n + " · " + sub + " = " + n * sub + ".");
        return t.at(2).exit(id, n * sub);
      })(args.n);
    },
  };

  FN.fib = {
    label: "fib(n) — naive",
    inputs: [{ id: "n", label: "n", value: 5, min: 0, max: 8 }],
    big: ["T(n) = T(n−1) + T(n−2) + O(1)", "Θ(φⁿ) ≈ Θ(1.618ⁿ)", "Θ(n) stack"],
    blurb:
      "Two recursive calls per level make the tree branch, and the same subproblems get solved over and over — " +
      "count how many times <span class='mono'>fib(2)</span> appears. That duplication is what makes naive Fibonacci " +
      "exponential, and it is exactly what memoisation kills.",
    code: {
      pseudo: [
        "fib(n):",
        "  if n ≤ 1: return n",
        "  return fib(n-1) + fib(n-2)",
      ],
      java: [
        "static int fib(int n) {",
        "  if (n <= 1) return n;",
        "  return fib(n - 1) + fib(n - 2);",
        "}",
      ],
      cpp: [
        "int fib(int n) {",
        "  if (n <= 1) return n;",
        "  return fib(n - 1) + fib(n - 2);",
        "}",
      ],
      python: [
        "def fib(n):",
        "  if n <= 1:",
        "    return n",
        "  return fib(n - 1) + fib(n - 2)",
      ],
      map: { python: [0, 2, 3] },
    },
    run(t, args) {
      (function f(n) {
        const id = t.at(0).enter("fib(" + n + ")");
        if (n <= 1) return t.at(1).exit(id, n, "<b>Base case</b>: fib(" + n + ") = " + n + ".");
        t.at(2).step("Needs both fib(" + (n - 1) + ") and fib(" + (n - 2) + "). The left branch runs <em>completely</em> first — depth-first.");
        const a = f(n - 1);
        t.at(2).step("Left branch gave fib(" + (n - 1) + ") = " + a + ". Now the right branch.");
        const b = f(n - 2);
        return t.at(2).exit(id, a + b, "fib(" + n + ") = " + a + " + " + b + " = <b>" + (a + b) + "</b>, returning.");
      })(args.n);
    },
  };

  FN.fibmemo = {
    label: "fib(n) — memoised",
    inputs: [{ id: "n", label: "n", value: 8, min: 0, max: 14 }],
    big: ["Θ(n) time", "Θ(n) space", "top-down DP"],
    blurb:
      "Same code, plus a table of answers already computed. Each value of n is genuinely computed once; every later " +
      "request is a table lookup that returns without recursing. The exponential tree collapses into a path with " +
      "stubs — n distinct subproblems, O(1) work each, so Θ(n).",
    code: {
      pseudo: [
        "fib(n, memo):",
        "  if n in memo: return memo[n]   // hit",
        "  if n ≤ 1: return n",
        "  memo[n] ← fib(n-1) + fib(n-2)",
        "  return memo[n]",
      ],
      java: [
        "static int fib(int n, Map<Integer,Integer> memo) {",
        "  if (memo.containsKey(n)) return memo.get(n); // hit",
        "  if (n <= 1) return n;",
        "  int v = fib(n - 1, memo) + fib(n - 2, memo);",
        "  memo.put(n, v);",
        "  return v;",
        "}",
      ],
      cpp: [
        "int fib(int n, unordered_map<int,int>& memo) {",
        "  auto it = memo.find(n);",
        "  if (it != memo.end()) return it->second;  // hit",
        "  if (n <= 1) return n;",
        "  return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);",
        "}",
      ],
      python: [
        "def fib(n, memo):",
        "  if n in memo:",
        "    return memo[n]             # hit",
        "  if n <= 1:",
        "    return n",
        "  memo[n] = fib(n - 1, memo) + fib(n - 2, memo)",
        "  return memo[n]",
      ],
      map: { java: [0, 1, 2, 3, 5], cpp: [0, 2, 3, 4, 4], python: [0, 2, 4, 5, 6] },
    },
    run(t, args) {
      const memo = {};
      t.view = { type: "memo", memo: memo, n: args.n };
      (function f(n) {
        const id = t.at(0).enter("fib(" + n + ")");
        if (memo[n] !== undefined) return t.at(1).exit(id, memo[n], "<b>Memo hit!</b> fib(" + n + ") was already computed = " + memo[n] + ". Return it without recursing — this is the pruned subtree.");
        if (n <= 1) { memo[n] = n; return t.at(2).exit(id, n, "Base case fib(" + n + ") = " + n + "; store it in the memo."); }
        t.at(3);
        const a = f(n - 1);
        const b = f(n - 2);
        memo[n] = a + b;
        return t.at(4).exit(id, memo[n], "Store <b>memo[" + n + "] = " + a + " + " + b + " = " + memo[n] + "</b> so nobody ever recomputes it.");
      })(args.n);
    },
  };

  FN.gcd = {
    label: "gcd(a, b) — Euclid",
    inputs: [
      { id: "a", label: "a", value: 84, min: 1, max: 999 },
      { id: "b", label: "b", value: 30, min: 0, max: 999 },
    ],
    big: ["O(log min(a,b))", "tail recursive"],
    blurb:
      "Euclid's insight: any common divisor of a and b also divides a mod b, so gcd(a, b) = gcd(b, a mod b). The " +
      "numbers shrink fast — each two steps at least halve the smaller one — so the depth is logarithmic. It is also " +
      "<em>tail recursive</em>: the recursive call is the whole return expression, so a compiler can turn it into a loop " +
      "with no stack growth at all.",
    code: {
      pseudo: [
        "gcd(a, b):",
        "  if b == 0: return a      // base case",
        "  return gcd(b, a mod b)   // tail call",
      ],
      java: [
        "static int gcd(int a, int b) {",
        "  if (b == 0) return a;      // base case",
        "  return gcd(b, a % b);      // tail call",
        "}",
      ],
      cpp: [
        "int gcd(int a, int b) {",
        "  if (b == 0) return a;      // base case",
        "  return gcd(b, a % b);      // tail call",
        "}",
      ],
      python: [
        "def gcd(a, b):",
        "  if b == 0:",
        "    return a               # base case",
        "  return gcd(b, a % b)     # tail call",
      ],
      map: { python: [0, 2, 3] },
    },
    run(t, args) {
      (function g(a, b) {
        const id = t.at(0).enter("gcd(" + a + ", " + b + ")");
        if (b === 0) return t.at(1).exit(id, a, "b = 0, so <b>gcd = a = " + a + "</b>. Everything above just passes this value straight back up.");
        t.at(2).step("a mod b = " + a + " mod " + b + " = " + (a % b) + ", so recurse on gcd(" + b + ", " + (a % b) + "). The arguments shrink quickly.");
        const r = g(b, a % b);
        return t.at(2).exit(id, r);
      })(args.a, args.b);
    },
  };

  FN.power = {
    label: "power(x, n) — fast",
    inputs: [
      { id: "x", label: "x", value: 3, min: 2, max: 9 },
      { id: "n", label: "n", value: 13, min: 0, max: 40 },
    ],
    big: ["T(n) = T(n/2) + O(1)", "Θ(log n)"],
    blurb:
      "Exponentiation by squaring. Instead of n multiplications, halve the exponent each step: x<sup>n</sup> = " +
      "(x<sup>n/2</sup>)² for even n, and x·(x<sup>⌊n/2⌋</sup>)² for odd n. Halving gives depth log₂n — the same " +
      "recurrence as binary search.",
    code: {
      pseudo: [
        "power(x, n):",
        "  if n == 0: return 1",
        "  half ← power(x, ⌊n/2⌋)",
        "  r ← half · half",
        "  if n is odd: r ← r · x",
        "  return r",
      ],
      java: [
        "static long power(long x, int n) {",
        "  if (n == 0) return 1;",
        "  long half = power(x, n / 2);",
        "  long r = half * half;",
        "  if (n % 2 == 1) r *= x;",
        "  return r;",
        "}",
      ],
      cpp: [
        "long long power(long long x, int n) {",
        "  if (n == 0) return 1;",
        "  long long half = power(x, n / 2);",
        "  long long r = half * half;",
        "  if (n % 2 == 1) r *= x;",
        "  return r;",
        "}",
      ],
      python: [
        "def power(x, n):",
        "  if n == 0:",
        "    return 1",
        "  half = power(x, n // 2)",
        "  r = half * half",
        "  if n % 2 == 1:",
        "    r *= x",
        "  return r",
      ],
      map: { python: [0, 2, 3, 4, 5, 7] },
    },
    run(t, args) {
      (function p(x, n) {
        const id = t.at(0).enter("power(" + x + ", " + n + ")");
        if (n === 0) return t.at(1).exit(id, 1, "n = 0, and x⁰ = 1. Base case.");
        t.at(2).step("Halve the exponent: we only need power(" + x + ", " + Math.floor(n / 2) + "), then square it.");
        const h = p(x, Math.floor(n / 2));
        let r = h * h;
        t.at(n % 2 ? 4 : 3).step("half = " + h + ", so half² = " + r + "." + (n % 2 ? " n = " + n + " is odd, so one extra factor of x is needed." : " n = " + n + " is even, so that is the answer."));
        if (n % 2) r *= x;
        return t.at(5).exit(id, r);
      })(args.x, args.n);
    },
  };

  FN.hanoi = {
    label: "Towers of Hanoi",
    inputs: [{ id: "n", label: "disks", value: 3, min: 1, max: 5 }],
    big: ["T(n) = 2T(n−1) + 1", "Θ(2ⁿ) moves", "exactly 2ⁿ − 1"],
    blurb:
      "The classic \"trust the recursion\" problem. To move n disks from A to C: move the top n−1 out of the way onto B, " +
      "move the single biggest disk to C, then move those n−1 from B onto C. You never have to think about how the " +
      "n−1 sub-tower gets moved — that is the recursive call's job. Two calls per level gives exactly 2ⁿ−1 moves.",
    code: {
      pseudo: [
        "hanoi(n, from, to, via):",
        "  if n == 0: return",
        "  hanoi(n-1, from, via, to)   // clear the way",
        "  move disk n: from → to",
        "  hanoi(n-1, via, to, from)   // pile back on",
      ],
      java: [
        "static void hanoi(int n, char from, char to, char via) {",
        "  if (n == 0) return;",
        "  hanoi(n - 1, from, via, to);   // clear the way",
        "  System.out.println(from + \" -> \" + to);",
        "  hanoi(n - 1, via, to, from);   // pile back on",
        "}",
      ],
      cpp: [
        "void hanoi(int n, char from, char to, char via) {",
        "  if (n == 0) return;",
        "  hanoi(n - 1, from, via, to);   // clear the way",
        "  cout << from << \" -> \" << to << '\\n';",
        "  hanoi(n - 1, via, to, from);   // pile back on",
        "}",
      ],
      python: [
        "def hanoi(n, src, dst, via):",
        "  if n == 0:",
        "    return",
        "  hanoi(n - 1, src, via, dst)    # clear the way",
        "  print(src, '->', dst)",
        "  hanoi(n - 1, via, dst, src)    # pile back on",
      ],
      map: { python: [0, 2, 3, 4, 5] },
    },
    run(t, args) {
      const n = args.n;
      const pegs = { A: [], B: [], C: [] };
      for (let d = n; d >= 1; d--) pegs.A.push(d);
      t.view = { type: "pegs", pegs: pegs, n: n, moves: 0 };
      let moves = 0;
      (function h(k, from, to, via) {
        const id = t.at(0).enter("hanoi(" + k + ", " + from + "→" + to + ")");
        if (k === 0) return t.at(1).exit(id, "—", "Zero disks to move — nothing to do. Base case.");
        t.at(2).step("To move " + k + " disks " + from + "→" + to + ": first get the top " + (k - 1) + " onto the spare peg " + via + ".");
        h(k - 1, from, via, to);
        const d = pegs[from].pop();
        pegs[to].push(d);
        moves++;
        t.view.moves = moves;
        t.at(3).step("<b>Move disk " + d + ": " + from + " → " + to + "</b> (move #" + moves + "). Peg " + to + " was free of anything smaller, so this is legal.");
        t.at(4).step("Now bring the " + (k - 1) + " disks from " + via + " onto " + to + ", on top of disk " + d + ".");
        h(k - 1, via, to, from);
        return t.at(4).exit(id, "done", "All " + k + " disks are on " + to + " — hanoi(" + k + ", " + from + "→" + to + ") is finished.");
      })(n, "A", "C", "B");
      t.step("Finished in <b>" + moves + " moves</b> = 2<sup>" + n + "</sup> − 1. Provably optimal.");
    },
  };

  FN.bsearch = {
    label: "binarySearch(A, target)",
    inputs: [{ id: "target", label: "target", value: 47, min: -999, max: 999 }],
    big: ["T(n) = T(n/2) + O(1)", "Θ(log n)"],
    blurb:
      "Halving recursion on a <em>sorted</em> array. Compare the target with the middle element: if it is smaller the " +
      "answer can only be in the left half, if larger only in the right half. Each call throws away half of what is " +
      "left, so 2<sup>k</sup> ≥ n gives at most ⌈log₂n⌉ + 1 comparisons.",
    code: {
      pseudo: [
        "binarySearch(A, target, lo, hi):",
        "  if lo > hi: return -1        // empty range",
        "  mid ← ⌊(lo + hi) / 2⌋",
        "  if A[mid] == target: return mid",
        "  if target < A[mid]:",
        "    return binarySearch(A, target, lo, mid-1)",
        "  else:",
        "    return binarySearch(A, target, mid+1, hi)",
      ],
      java: [
        "static int binarySearch(int[] a, int target, int lo, int hi) {",
        "  if (lo > hi) return -1;              // empty range",
        "  int mid = lo + (hi - lo) / 2;",
        "  if (a[mid] == target) return mid;",
        "  if (target < a[mid])",
        "    return binarySearch(a, target, lo, mid - 1);",
        "  else",
        "    return binarySearch(a, target, mid + 1, hi);",
        "}",
      ],
      cpp: [
        "int binarySearch(vector<int>& a, int target, int lo, int hi) {",
        "  if (lo > hi) return -1;              // empty range",
        "  int mid = lo + (hi - lo) / 2;",
        "  if (a[mid] == target) return mid;",
        "  if (target < a[mid])",
        "    return binarySearch(a, target, lo, mid - 1);",
        "  else",
        "    return binarySearch(a, target, mid + 1, hi);",
        "}",
      ],
      python: [
        "def binary_search(a, target, lo, hi):",
        "  if lo > hi:",
        "    return -1                      # empty range",
        "  mid = (lo + hi) // 2",
        "  if a[mid] == target:",
        "    return mid",
        "  if target < a[mid]:",
        "    return binary_search(a, target, lo, mid - 1)",
        "  else:",
        "    return binary_search(a, target, mid + 1, hi)",
      ],
      map: { python: [0, 2, 3, 5, 6, 7, 8, 9] },
    },
    arrayInput: true,
    run(t, args) {
      const A = args.arr, target = args.target;
      t.view = { type: "array", arr: A, lo: 0, hi: A.length - 1, mid: null, target: target };
      (function bs(lo, hi) {
        const id = t.at(0).enter("bSearch(" + lo + ", " + hi + ")");
        t.view.lo = lo; t.view.hi = hi; t.view.mid = null;
        if (lo > hi) { t.at(1).step("lo = " + lo + " &gt; hi = " + hi + " — the range is empty."); return t.at(1).exit(id, -1, "Nothing left to search, so return <b>−1</b>: " + target + " is not in the array."); }
        const mid = Math.floor((lo + hi) / 2);
        t.view.mid = mid;
        t.at(2).step("Range A[" + lo + "…" + hi + "] holds " + (hi - lo + 1) + " candidates. mid = ⌊(" + lo + "+" + hi + ")/2⌋ = " + mid + ", A[mid] = " + A[mid] + ".");
        if (A[mid] === target) return t.at(3).exit(id, mid, "A[" + mid + "] == " + target + " — <b>found at index " + mid + "</b>.");
        if (target < A[mid]) {
          t.at(4).step(target + " &lt; " + A[mid] + ", and the array is sorted, so everything from mid rightwards is too big. Discard it and search A[" + lo + "…" + (mid - 1) + "].");
          const r = bs(lo, mid - 1);
          return t.at(5).exit(id, r);
        }
        t.at(6).step(target + " &gt; " + A[mid] + ", so everything from mid leftwards is too small. Search A[" + (mid + 1) + "…" + hi + "].");
        const r = bs(mid + 1, hi);
        return t.at(7).exit(id, r);
      })(0, A.length - 1);
    },
  };

  FN.perms = {
    label: "permutations(s)",
    inputs: [],
    stringInput: { id: "str", label: "string", value: "ABC", max: 4 },
    big: ["n! leaves", "Θ(n · n!)"],
    blurb:
      "Backtracking: at each level choose one of the remaining characters, recurse on what is left, then undo the " +
      "choice and try the next one. The tree has n choices at the root, n−1 below that, and so on — n! leaves, each " +
      "one a complete permutation.",
    code: {
      pseudo: [
        "permute(chosen, rest):",
        "  if rest is empty:",
        "    output chosen           // a leaf",
        "    return",
        "  for each character c in rest:",
        "    permute(chosen + c, rest minus c)  // choose, recurse, undo",
      ],
      java: [
        "static void permute(String chosen, String rest) {",
        "  if (rest.isEmpty()) {",
        "    System.out.println(chosen);          // a leaf",
        "    return;",
        "  }",
        "  for (int i = 0; i < rest.length(); i++)",
        "    permute(chosen + rest.charAt(i),",
        "            rest.substring(0, i) + rest.substring(i + 1));",
        "}",
      ],
      cpp: [
        "void permute(string chosen, string rest) {",
        "  if (rest.empty()) {",
        "    cout << chosen << '\\n';              // a leaf",
        "    return;",
        "  }",
        "  for (int i = 0; i < (int)rest.size(); i++)",
        "    permute(chosen + rest[i],",
        "            rest.substr(0, i) + rest.substr(i + 1));",
        "}",
      ],
      python: [
        "def permute(chosen, rest):",
        "  if not rest:",
        "    print(chosen)                        # a leaf",
        "    return",
        "  for i, c in enumerate(rest):",
        "    permute(chosen + c, rest[:i] + rest[i+1:])",
      ],
      map: { java: [0, 1, 2, 3, 5, 6], cpp: [0, 1, 2, 3, 5, 6] },
    },
    run(t, args) {
      const out = [];
      t.view = { type: "list", label: "permutations found", items: out };
      (function p(chosen, rest) {
        const id = t.at(0).enter("permute(\"" + chosen + "\", \"" + rest + "\")");
        if (!rest.length) {
          out.push(chosen);
          return t.at(2).exit(id, chosen, "<b>Leaf reached</b> — nothing left to choose, so \"" + chosen + "\" is a complete permutation (#" + out.length + ").");
        }
        t.at(4).step("Still " + rest.length + " character(s) to place: " + rest.split("").join(", ") + ". Try each one in turn as the next character.");
        for (let i = 0; i < rest.length; i++) {
          t.at(5).step("Choose <b>" + rest[i] + "</b> → prefix \"" + chosen + rest[i] + "\", remaining \"" + (rest.slice(0, i) + rest.slice(i + 1)) + "\".");
          p(chosen + rest[i], rest.slice(0, i) + rest.slice(i + 1));
          t.at(4).step("Back at permute(\"" + chosen + "\", \"" + rest + "\") — <b>undo</b> the choice of " + rest[i] + " and move on." + (i + 1 < rest.length ? "" : " That was the last option here."));
        }
        return t.at(5).exit(id, out.length + " found", "Every choice at this level has been explored — return to the caller.");
      })("", args.str);
    },
  };

  /* =======================================================
     layout + rendering
     ======================================================= */
  let nodes = [], geom = { w: 400, h: 200, nw: 90 }, codeBlock = null;

  function layout(ns) {
    if (!ns.length) return;
    let nw = 62;
    ns.forEach((n) => (nw = Math.max(nw, n.label.length * 7.1 + 14)));
    nw = Math.min(nw, 150);
    const gapX = nw + 14, gapY = 74;
    let leaf = 0, maxD = 0;
    (function walk(n) {
      maxD = Math.max(maxD, n.depth);
      if (!n.children.length) n._x = leaf++ * gapX + gapX / 2;
      else {
        n.children.forEach(walk);
        n._x = (n.children[0]._x + n.children[n.children.length - 1]._x) / 2;
      }
      n._y = 26 + n.depth * gapY;
    })(ns[0]);
    geom = { w: Math.max(340, leaf * gapX + 20), h: 26 + (maxD + 1) * gapY + 26, nw: nw };
  }

  function render(f) {
    /* --- the line this frame is executing --- */
    if (codeBlock && f.line != null) codeBlock.highlight(f.line);

    /* --- call stack --- */
    const sc = q("stack-view");
    sc.innerHTML = "";
    if (!f.stack) { sc.appendChild(D.el("p", { class: "small muted", text: "Press Run." })); }
    else if (!f.stack.length) sc.appendChild(D.el("p", { class: "small muted", text: "The call stack is empty — the outermost call has returned." }));
    else {
      const col = D.el("div", { style: "display:flex;flex-direction:column-reverse;gap:3px" });
      f.stack.forEach((id, k) => {
        const n = nodes[id];
        const top = k === f.stack.length - 1;
        const box = D.el("div", {
          class: "cell " + (top ? "active" : "visit") + " filled",
          style: "min-width:170px;height:34px;font-size:.78rem;justify-content:flex-start;padding:0 .5rem",
          text: n.label,
        });
        if (top) box.appendChild(D.el("span", { class: "ptr", style: "left:auto;right:-3.6rem;bottom:auto;top:50%;transform:translateY(-50%)", text: "← running" }));
        col.appendChild(box);
      });
      const holder = D.el("div", { style: "padding-right:3.8rem" });
      holder.appendChild(col);
      sc.appendChild(holder);
    }

    /* --- recursion tree --- */
    const tv = q("tree-view");
    tv.innerHTML = "";
    const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + geom.w + " " + geom.h, width: geom.w, height: geom.h });
    const NW = geom.nw, NH = 30;
    const drawn = f.created || 0;
    for (let i = 0; i < drawn && i < nodes.length; i++) {
      const n = nodes[i];
      if (n.parent !== null && n.parent < drawn) {
        const p = nodes[n.parent];
        svg.appendChild(D.sLine(p._x, p._y + NH / 2, n._x, n._y - NH / 2, "edge " + (f.states[n.id] === "done" ? "tree" : f.states[n.id] ? "on" : "dim")));
      }
    }
    for (let i = 0; i < drawn && i < nodes.length; i++) {
      const n = nodes[i];
      const st = f.states[n.id];
      const cls = st === "active" ? "active" : st === "done" ? "done" : "visit";
      svg.appendChild(D.svg("rect", { x: n._x - NW / 2, y: n._y - NH / 2, width: NW, height: NH, rx: 7, class: "node-c " + cls }));
      svg.appendChild(D.sText(n._x, n._y, n.label, { "font-size": Math.min(12, 1100 / Math.max(12, n.label.length * 8)) + "" }));
      if (n.ret !== undefined && st === "done")
        svg.appendChild(D.sText(n._x, n._y + NH / 2 + 11, "↩ " + fmt(n.ret), { class: "lbl-s", fill: "#4ade80", "font-size": 10 }));
    }
    if (!drawn) svg.appendChild(D.sText(geom.w / 2, 30, "no calls yet", { class: "lbl-s" }));
    tv.appendChild(svg);

    /* --- side view --- */
    const sv = q("side-view");
    sv.innerHTML = "";
    if (f.view) sv.appendChild(sideView(f.view));
    q("side-panel").style.display = f.view ? "block" : "none";

    q("r-calls").textContent = f.calls == null ? "–" : f.calls;
    q("r-depth").textContent = f.depth == null ? "–" : f.depth;
    q("r-max").textContent = f.maxDepth == null ? "–" : f.maxDepth;
    q("r-ret").textContent = f.returns == null ? "–" : f.returns;
  }

  function sideView(v) {
    if (v.type === "pegs") {
      const W = 420, H = 170, pegW = 120;
      const svg = D.svg("svg", { class: "canvas", viewBox: "0 0 " + W + " " + H, width: W, height: H });
      ["A", "B", "C"].forEach((name, pi) => {
        const cx = 70 + pi * pegW;
        svg.appendChild(D.svg("rect", { x: cx - 3, y: 30, width: 6, height: 100, rx: 3, fill: "#39456b" }));
        svg.appendChild(D.svg("rect", { x: cx - 52, y: 130, width: 104, height: 7, rx: 3, fill: "#39456b" }));
        svg.appendChild(D.sText(cx, 152, name, { class: "lbl-s", "font-size": 12 }));
        v.pegs[name].forEach((d, k) => {
          const w = 26 + d * 15;
          svg.appendChild(D.svg("rect", { x: cx - w / 2, y: 130 - (k + 1) * 15, width: w, height: 13, rx: 5, fill: ["#6ea8fe", "#a78bfa", "#4ade80", "#ffc14d", "#ff6b9d"][(d - 1) % 5], opacity: .9 }));
          svg.appendChild(D.sText(cx, 130 - (k + 1) * 15 + 7, d, { "font-size": 9, fill: "#0a0e1a" }));
        });
      });
      svg.appendChild(D.sText(W - 60, 18, "moves: " + v.moves, { class: "lbl-s", "font-size": 12, fill: "#ffc14d" }));
      return svg;
    }
    if (v.type === "array") {
      const wrap = D.el("div", { style: "padding:1.3rem 0 1.7rem" });
      const row = D.el("div", { class: "cells" });
      v.arr.forEach((x, i) => {
        let cls = "empty";
        if (i >= v.lo && i <= v.hi) cls = "filled";
        if (i === v.mid) cls = "filled target";
        if (x === v.target && i === v.mid) cls = "filled done";
        const c = D.el("div", { class: "cell " + cls, text: x, style: "min-width:42px;height:38px;font-size:.8rem" });
        c.appendChild(D.el("span", { class: "idx", text: i }));
        const tags = [];
        if (i === v.lo) tags.push("lo");
        if (i === v.mid) tags.push("mid");
        if (i === v.hi) tags.push("hi");
        if (tags.length) c.appendChild(D.el("span", { class: "ptr", text: tags.join("/") }));
        row.appendChild(c);
      });
      wrap.appendChild(row);
      wrap.appendChild(D.el("p", { class: "small muted", style: "margin:.4rem 0 0", html: "searching for <b>" + v.target + "</b> — pale cells have already been discarded" }));
      return wrap;
    }
    if (v.type === "memo") {
      const wrap = D.el("div");
      const row = D.el("div", { class: "cells", style: "margin-top:1.2rem" });
      for (let i = 0; i <= v.n; i++) {
        const has = v.memo[i] !== undefined;
        const c = D.el("div", { class: "cell " + (has ? "filled done" : "empty"), text: has ? v.memo[i] : "·", style: "min-width:40px;height:36px;font-size:.78rem" });
        c.appendChild(D.el("span", { class: "idx", text: i }));
        row.appendChild(c);
      }
      wrap.appendChild(row);
      wrap.appendChild(D.el("p", { class: "small muted", style: "margin:.9rem 0 0", text: "memo[n] — green cells are answers that never need recomputing" }));
      return wrap;
    }
    if (v.type === "list") {
      const wrap = D.el("div");
      wrap.appendChild(D.el("div", { class: "small muted", text: v.label + " (" + v.items.length + ")", style: "margin-bottom:.4rem" }));
      const row = D.el("div", { class: "cells" });
      v.items.forEach((s) => row.appendChild(D.el("div", { class: "cell filled done", text: s, style: "min-width:52px;height:32px;font-size:.78rem" })));
      wrap.appendChild(v.items.length ? row : D.el("div", { class: "small muted", text: "none yet" }));
      return wrap;
    }
    return D.el("div");
  }

  /* =======================================================
     init
     ======================================================= */
  const ORDER = ["factorial", "fib", "fibmemo", "gcd", "power", "hanoi", "bsearch", "perms"];
  let cur = "factorial", player, sortedArr = [];

  function buildInputs(id) {
    const f = FN[id], box = q("inputs");
    box.innerHTML = "";
    (f.inputs || []).forEach((inp) => {
      const wrap = D.el("div", { class: "field" });
      wrap.appendChild(D.el("label", { text: inp.label }));
      wrap.appendChild(D.el("input", { type: "number", id: "in-" + inp.id, value: inp.value, min: inp.min, max: inp.max, style: "width:5rem" }));
      box.appendChild(wrap);
    });
    if (f.stringInput) {
      const wrap = D.el("div", { class: "field" });
      wrap.appendChild(D.el("label", { text: f.stringInput.label }));
      wrap.appendChild(D.el("input", { type: "text", id: "in-str", value: f.stringInput.value, style: "width:6rem" }));
      box.appendChild(wrap);
    }
    if (f.arrayInput) {
      const wrap = D.el("div", { class: "field" });
      wrap.appendChild(D.el("label", { text: "sorted array" }));
      wrap.appendChild(D.el("input", { type: "text", id: "in-arr", class: "wide", value: sortedArr.join(", ") }));
      box.appendChild(wrap);
    }
  }

  function select(id) {
    cur = id;
    const f = FN[id];
    q("fn-name").textContent = f.label;
    q("fn-blurb").innerHTML = f.blurb;
    q("fn-big").innerHTML = f.big.map((b) => "<span>" + b + "</span>").join("");
    codeBlock = D.CodeBlock("#fn-code", f.code);
    D.$$("#fn-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    buildInputs(id);
    nodes = [];
    player.load([{ note: "Ready — press <b>Run</b> to trace " + f.label + "." }], false);
  }

  function run() {
    const f = FN[cur];
    const args = {};
    (f.inputs || []).forEach((inp) => {
      let v = parseInt(D.$("#in-" + inp.id).value, 10);
      if (isNaN(v)) v = inp.value;
      v = D.clamp(v, inp.min, inp.max);
      D.$("#in-" + inp.id).value = v;
      args[inp.id] = v;
    });
    if (f.stringInput) {
      let s = (D.$("#in-str").value || "ABC").replace(/\s+/g, "").slice(0, f.stringInput.max);
      D.$("#in-str").value = s;
      if (!s.length) return D.toast("Enter at least one character.", true);
      args.str = s;
    }
    if (f.arrayInput) {
      let a = D.parseNums(D.$("#in-arr").value);
      if (a.length < 2) a = sortedArr.slice();
      a.sort((x, y) => x - y);
      sortedArr = a;
      D.$("#in-arr").value = a.join(", ");
      args.arr = a;
    }
    const t = new Tracer(1600);
    t.frame("Ready to call the outermost function. The call stack is empty.");
    f.run(t, args);
    t.frame("Done. The stack is empty again — every frame that was pushed has been popped. Total calls: <b>" + t.calls + "</b>, deepest the stack ever got: <b>" + t.maxDepth + "</b>.");
    nodes = t.nodes;
    layout(nodes);
    if (t.over) D.toast("Trace truncated — try a smaller input.", true);
    player.load(t.frames, true);
  }

  document.addEventListener("DOMContentLoaded", function () {
    sortedArr = [3, 8, 14, 21, 29, 36, 47, 55, 68, 74, 82, 91];
    player = new D.Player({ mount: "#player", render: render, delay: 700 });
    const tabs = q("fn-tabs");
    ORDER.forEach((id) => tabs.appendChild(D.el("button", { text: FN[id].label, "data-id": id, onclick: () => select(id) })));
    q("btn-run").addEventListener("click", run);
    D.legend("#legend", [
      { color: "var(--c-active)", label: "currently running (top of stack)" },
      { color: "var(--c-visit)", label: "on the stack, waiting for a sub-call" },
      { color: "var(--c-done)", label: "returned" },
    ]);
    select("factorial");
  });
})();
