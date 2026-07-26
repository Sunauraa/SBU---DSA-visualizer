/* ============================================================
   stacks.js — stack, circular-array queue, deque, and two
   classic stack applications (bracket matching, postfix eval)
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;
  const q = (id) => D.$("#" + id);
  const CAP = 8;

  /* ---------------- state ---------------- */
  const S = { items: [], cap: CAP };                       /* stack: top = last */
  const Q = { buf: new Array(CAP).fill(null), front: 0, size: 0, cap: CAP };
  const K = { buf: new Array(CAP).fill(null), front: 0, size: 0, cap: CAP };

  let player, mode = "stack";

  function rec(build, limit) {
    const R = new D.Recorder(limit || 900);
    build({ push: (f) => R.push(f) });
    return R.frames;
  }

  /* =======================================================
     STACK
     ======================================================= */
  const stackF = {
    snapshot(marks, note, extra) {
      return Object.assign({ kind: "stack", items: S.items.slice(), cap: S.cap, marks: marks || {}, note: note }, extra || {});
    },
    push(v) {
      return rec((r) => {
        r.push(this.snapshot({}, "<b>push(" + v + ")</b> — a stack only ever touches one end, the <b>top</b>."));
        if (S.items.length >= S.cap) {
          r.push(this.snapshot({}, "<b>Stack overflow.</b> This array-backed stack is full at " + S.cap + " elements. A real implementation would grow the array (amortised O(1)) or throw."));
          return;
        }
        S.items.push(v);
        r.push(this.snapshot({ [S.items.length - 1]: "done" }, "Write " + v + " at index <span class='mono'>top+1 = " + (S.items.length - 1) + "</span> and increment top. <b>O(1)</b>, no shifting."));
      });
    },
    pop() {
      return rec((r) => {
        if (!S.items.length) {
          r.push(this.snapshot({}, "<b>Stack underflow</b> — pop on an empty stack. <span class='mono'>top == -1</span>."));
          return;
        }
        const i = S.items.length - 1, v = S.items[i];
        r.push(this.snapshot({ [i]: "swap" }, "<b>pop()</b> — read the element at top (index " + i + "), value " + v + "."));
        S.items.pop();
        r.push(this.snapshot({}, "Decrement top to " + (S.items.length - 1) + " and return " + v + ". The slot is left as garbage; nothing else moves. <b>LIFO</b>: last in, first out."));
      });
    },
    peek() {
      return rec((r) => {
        if (!S.items.length) { r.push(this.snapshot({}, "The stack is empty — nothing to peek at.")); return; }
        const i = S.items.length - 1;
        r.push(this.snapshot({ [i]: "target" }, "<b>peek()</b> returns " + S.items[i] + " but leaves top alone — the stack is unchanged."));
      });
    },
  };

  /* =======================================================
     CIRCULAR QUEUE  (front + size, wrap with modulo)
     ======================================================= */
  function ringSnapshot(kind, st, marks, note, extra) {
    const cells = st.buf.slice();
    const live = [];
    for (let k = 0; k < st.size; k++) live.push((st.front + k) % st.cap);
    return Object.assign(
      {
        kind: kind, cells: cells, live: live, front: st.front, size: st.size, cap: st.cap,
        rear: st.size ? (st.front + st.size - 1) % st.cap : null,
        next: (st.front + st.size) % st.cap,
        marks: marks || {}, note: note,
      },
      extra || {}
    );
  }

  const queueF = {
    enqueue(v) {
      return rec((r) => {
        r.push(ringSnapshot("queue", Q, {}, "<b>enqueue(" + v + ")</b> — new elements always join at the <b>rear</b>."));
        if (Q.size === Q.cap) { r.push(ringSnapshot("queue", Q, {}, "<b>Queue full</b> at " + Q.cap + " elements. Note that <em>full</em> and <em>empty</em> both give front == next — which is why you track size (or leave one slot unused).")); return; }
        const at = (Q.front + Q.size) % Q.cap;
        r.push(ringSnapshot("queue", Q, { [at]: "cmp" }, "The next free slot is <span class='mono'>(front + size) % " + Q.cap + " = (" + Q.front + " + " + Q.size + ") % " + Q.cap + " = " + at + "</span>."));
        Q.buf[at] = v; Q.size++;
        r.push(ringSnapshot("queue", Q, { [at]: "done" }, "Store " + v + " at index " + at + " and increment size to " + Q.size + ". <b>O(1)</b> — nothing is shifted, the indices just wrap."));
      });
    },
    dequeue() {
      return rec((r) => {
        if (!Q.size) { r.push(ringSnapshot("queue", Q, {}, "The queue is <b>empty</b> — size == 0, so dequeue fails.")); return; }
        const at = Q.front, v = Q.buf[at];
        r.push(ringSnapshot("queue", Q, { [at]: "swap" }, "<b>dequeue()</b> — take the element at <b>front</b> = " + at + ", value " + v + "."));
        Q.buf[at] = null; Q.front = (Q.front + 1) % Q.cap; Q.size--;
        r.push(ringSnapshot("queue", Q, {}, "Advance <span class='mono'>front = (" + at + " + 1) % " + Q.cap + " = " + Q.front + "</span> and drop size to " + Q.size + ". Returned " + v + ". <b>FIFO</b>, and O(1) — a naive queue that shifts everything left would be O(n)."));
      });
    },
    peek() {
      return rec((r) => {
        if (!Q.size) { r.push(ringSnapshot("queue", Q, {}, "Empty queue — nothing at the front.")); return; }
        r.push(ringSnapshot("queue", Q, { [Q.front]: "target" }, "<b>peek()</b> = " + Q.buf[Q.front] + " (index " + Q.front + "), queue unchanged."));
      });
    },
  };

  /* =======================================================
     DEQUE (same ring, both ends live)
     ======================================================= */
  const dequeF = {
    addFirst(v) {
      return rec((r) => {
        r.push(ringSnapshot("deque", K, {}, "<b>addFirst(" + v + ")</b> — grow leftwards from the front."));
        if (K.size === K.cap) { r.push(ringSnapshot("deque", K, {}, "<b>Full</b> at " + K.cap + " elements.")); return; }
        const at = (K.front - 1 + K.cap) % K.cap;
        r.push(ringSnapshot("deque", K, { [at]: "cmp" }, "New front index = <span class='mono'>(front - 1 + " + K.cap + ") % " + K.cap + " = " + at + "</span>. The <span class='mono'>+ cap</span> keeps the modulo positive when front is 0."));
        K.buf[at] = v; K.front = at; K.size++;
        r.push(ringSnapshot("deque", K, { [at]: "done" }, "Store " + v + " and move front to " + at + ". <b>O(1)</b> at either end — this is how <span class='mono'>ArrayDeque</span> works."));
      });
    },
    addLast(v) {
      return rec((r) => {
        r.push(ringSnapshot("deque", K, {}, "<b>addLast(" + v + ")</b> — grow rightwards from the rear."));
        if (K.size === K.cap) { r.push(ringSnapshot("deque", K, {}, "<b>Full</b> at " + K.cap + " elements.")); return; }
        const at = (K.front + K.size) % K.cap;
        r.push(ringSnapshot("deque", K, { [at]: "cmp" }, "Next free slot = <span class='mono'>(front + size) % " + K.cap + " = " + at + "</span>."));
        K.buf[at] = v; K.size++;
        r.push(ringSnapshot("deque", K, { [at]: "done" }, "Store " + v + " at " + at + ", size = " + K.size + "."));
      });
    },
    removeFirst() {
      return rec((r) => {
        if (!K.size) { r.push(ringSnapshot("deque", K, {}, "Empty deque.")); return; }
        const at = K.front, v = K.buf[at];
        r.push(ringSnapshot("deque", K, { [at]: "swap" }, "<b>removeFirst()</b> → " + v + " from index " + at + "."));
        K.buf[at] = null; K.front = (K.front + 1) % K.cap; K.size--;
        r.push(ringSnapshot("deque", K, {}, "front becomes " + K.front + ", size " + K.size + "."));
      });
    },
    removeLast() {
      return rec((r) => {
        if (!K.size) { r.push(ringSnapshot("deque", K, {}, "Empty deque.")); return; }
        const at = (K.front + K.size - 1) % K.cap, v = K.buf[at];
        r.push(ringSnapshot("deque", K, { [at]: "swap" }, "<b>removeLast()</b> → " + v + " from the rear index " + at + "."));
        K.buf[at] = null; K.size--;
        r.push(ringSnapshot("deque", K, {}, "Just drop size to " + K.size + " — front does not move. A singly linked list cannot do this in O(1)."));
      });
    },
  };

  /* =======================================================
     APPLICATIONS
     ======================================================= */
  const PAIRS = { ")": "(", "]": "[", "}": "{" };

  function brackets(str) {
    return rec((r) => {
      const st = [];
      const snap = (i, marks, note, ok) => r.push({ kind: "brackets", str: str, i: i, stack: st.slice(), marks: marks || {}, note: note, ok: ok });
      snap(-1, {}, "Scan left to right with an empty stack. Openers get pushed; a closer must match whatever is on top.");
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if ("([{".indexOf(c) >= 0) {
          st.push(c);
          snap(i, { [st.length - 1]: "done" }, "<b>" + c + "</b> is an opener — push it. The stack remembers what still has to be closed, innermost on top.");
        } else if (PAIRS[c]) {
          if (!st.length) { snap(i, {}, "<b>" + c + "</b> closes something, but the stack is <b>empty</b> — nothing is open. <b>Not balanced.</b>", false); return; }
          const top = st[st.length - 1];
          snap(i, { [st.length - 1]: "cmp" }, "<b>" + c + "</b> is a closer. Top of stack is <b>" + top + "</b>; it must be <b>" + PAIRS[c] + "</b>.");
          if (top !== PAIRS[c]) { snap(i, { [st.length - 1]: "swap" }, "Mismatch: <b>" + top + "</b> cannot be closed by <b>" + c + "</b>. <b>Not balanced.</b>", false); return; }
          st.pop();
          snap(i, {}, "They match — pop. " + (st.length ? "Still open: " + st.join(" ") + "." : "The stack is empty again."));
        } else {
          snap(i, {}, "'" + c + "' is not a bracket — ignore it.");
        }
      }
      if (st.length) snap(str.length, { [st.length - 1]: "swap" }, "End of input but the stack still holds <b>" + st.join(" ") + "</b> — those were never closed. <b>Not balanced.</b>", false);
      else snap(str.length, {}, "End of input and the stack is empty — <b>balanced.</b> ✓", true);
    });
  }

  function postfix(src) {
    const toks = D.parseTokens(src);
    return rec((r) => {
      const st = [];
      const snap = (i, marks, note, bad) => r.push({ kind: "postfix", toks: toks, i: i, stack: st.slice(), marks: marks || {}, note: note, bad: bad });
      snap(-1, {}, "Postfix (reverse Polish) needs no parentheses and no precedence rules — just a stack.");
      for (let i = 0; i < toks.length; i++) {
        const t = toks[i];
        if (/^-?\d+(\.\d+)?$/.test(t)) {
          st.push(parseFloat(t));
          snap(i, { [st.length - 1]: "done" }, "<b>" + t + "</b> is an operand — push it.");
        } else if ("+-*/%^".indexOf(t) >= 0 && t.length === 1) {
          if (st.length < 2) { snap(i, {}, "Operator <b>" + t + "</b> needs two operands but the stack has " + st.length + ". <b>Malformed expression.</b>", true); return; }
          const b = st.pop(), a = st.pop();
          snap(i, {}, "<b>" + t + "</b> is an operator — pop the top two: <b>b = " + b + "</b> then <b>a = " + a + "</b>. Order matters for − and ÷.");
          let v;
          if (t === "+") v = a + b; else if (t === "-") v = a - b; else if (t === "*") v = a * b;
          else if (t === "/") { if (b === 0) { snap(i, {}, "Division by zero.", true); return; } v = a / b; }
          else if (t === "%") v = a % b; else v = Math.pow(a, b);
          v = Math.round(v * 1000) / 1000;
          st.push(v);
          snap(i, { [st.length - 1]: "swap" }, "Push the result <b>" + a + " " + t + " " + b + " = " + v + "</b>.");
        } else {
          snap(i, {}, "Unrecognised token '" + t + "'.", true); return;
        }
      }
      if (st.length === 1) snap(toks.length, { 0: "done" }, "Input consumed and exactly one value is left: the answer is <b>" + st[0] + "</b>. ✓");
      else snap(toks.length, {}, "Input consumed but " + st.length + " values remain — <b>malformed expression</b>.", true);
    });
  }

  /* =======================================================
     RENDERING
     ======================================================= */
  function render(f) {
    const stage = q("stage");
    stage.innerHTML = "";
    if (!f.kind) { stage.appendChild(D.el("p", { class: "muted small", text: "Choose an operation." })); return; }

    if (f.kind === "stack") {
      stage.appendChild(stackView(f.items, f.cap, f.marks));
      setStats([["size", f.items.length], ["capacity", f.cap], ["top index", f.items.length - 1]]);
    } else if (f.kind === "queue" || f.kind === "deque") {
      stage.appendChild(ringView(f));
      setStats(
        f.kind === "queue"
          ? [["size", f.size], ["capacity", f.cap], ["front", f.front], ["rear", f.rear == null ? "–" : f.rear], ["next free", f.next]]
          : [["size", f.size], ["capacity", f.cap], ["front", f.front], ["rear", f.rear == null ? "–" : f.rear]]
      );
    } else if (f.kind === "brackets") {
      stage.appendChild(tokenRow(f.str.split(""), f.i, f.ok === false ? "swap" : "active"));
      stage.appendChild(stackView(f.stack, 12, f.marks, "stack (top on top)"));
      setStats([["scanned", Math.max(0, f.i + (f.i < f.str.length ? 1 : 0)) + " / " + f.str.length], ["stack depth", f.stack.length], ["verdict", f.ok == null ? "…" : f.ok ? "balanced" : "not balanced"]]);
    } else if (f.kind === "postfix") {
      stage.appendChild(tokenRow(f.toks, f.i, f.bad ? "swap" : "active"));
      stage.appendChild(stackView(f.stack, 12, f.marks, "operand stack"));
      setStats([["token", (f.i + 1) + " / " + f.toks.length], ["stack depth", f.stack.length]]);
    }
  }

  function stackView(items, cap, marks, label) {
    const wrap = D.el("div", { style: "display:flex;gap:1.1rem;align-items:flex-end;flex-wrap:wrap" });
    const col = D.el("div", { style: "display:flex;flex-direction:column-reverse;gap:4px;min-height:60px" });
    const shown = Math.max(items.length, Math.min(cap, 6));
    for (let i = 0; i < shown; i++) {
      const has = i < items.length;
      const c = D.el("div", {
        class: "cell " + (marks[i] || "") + (has ? " filled" : " empty"),
        text: has ? items[i] : "",
        style: "min-width:104px;height:38px",
      });
      c.appendChild(D.el("span", { class: "idx", style: "left:-1.9rem;top:50%;transform:translateY(-50%)", text: i }));
      if (has && i === items.length - 1) c.appendChild(D.el("span", { class: "ptr", style: "left:auto;right:-3.1rem;bottom:auto;top:50%;transform:translateY(-50%)", text: "← top" }));
      col.appendChild(c);
    }
    const box = D.el("div", { style: "padding-left:2.2rem;padding-right:3.4rem" });
    box.appendChild(D.el("div", { class: "small muted", text: label || "stack (array-backed)", style: "margin-bottom:.4rem" }));
    box.appendChild(col);
    wrap.appendChild(box);
    if (!items.length) wrap.appendChild(D.el("div", { class: "small muted", text: "empty" }));
    return wrap;
  }

  function ringView(f) {
    const wrap = D.el("div");
    wrap.appendChild(D.el("div", { class: "small muted", text: "circular array of capacity " + f.cap + " — indices wrap with % " + f.cap, style: "margin-bottom:1rem" }));
    const row = D.el("div", { class: "cells" });
    for (let i = 0; i < f.cap; i++) {
      const live = f.live.indexOf(i) >= 0;
      const c = D.el("div", { class: "cell " + (f.marks[i] || "") + (live ? " filled" : " empty"), text: live ? f.cells[i] : "·", style: "min-width:52px" });
      c.appendChild(D.el("span", { class: "idx", text: i }));
      const tags = [];
      if (f.size && i === f.front) tags.push("front");
      if (f.size && i === f.rear) tags.push("rear");
      if (!f.size && i === f.front) tags.push("front/next");
      if (tags.length) c.appendChild(D.el("span", { class: "ptr", text: tags.join(" ") }));
      row.appendChild(c);
    }
    const holder = D.el("div", { style: "padding:1.2rem 0 1.8rem" });
    holder.appendChild(row);
    wrap.appendChild(holder);

    /* logical order */
    const logical = D.el("div", { class: "cells" });
    f.live.forEach((idx, k) => {
      logical.appendChild(D.el("div", { class: "cell filled " + (k === 0 ? "target" : ""), text: f.cells[idx], style: "min-width:44px;height:34px;font-size:.8rem" }));
    });
    wrap.appendChild(D.el("div", { class: "small muted", text: "logical order, front first:", style: "margin:.2rem 0 .3rem" }));
    wrap.appendChild(f.live.length ? logical : D.el("div", { class: "small muted", text: "(empty)" }));
    return wrap;
  }

  function tokenRow(toks, cur, cls) {
    const wrap = D.el("div", { style: "margin-bottom:1.4rem" });
    wrap.appendChild(D.el("div", { class: "small muted", text: "input", style: "margin-bottom:.4rem" }));
    const row = D.el("div", { class: "cells" });
    toks.forEach((t, i) => {
      row.appendChild(D.el("div", {
        class: "cell " + (i === cur ? cls : i < cur ? "ghost filled" : "empty"),
        text: t,
        style: "min-width:34px;height:36px",
      }));
    });
    wrap.appendChild(row);
    return wrap;
  }

  function setStats(pairs) {
    q("stats").innerHTML = pairs
      .map((p) => '<div class="stat"><span class="k">' + p[0] + '</span><span class="v">' + p[1] + "</span></div>")
      .join("");
  }

  /* =======================================================
     init
     ======================================================= */
  /* ---------- the circular-buffer queue, in four languages ---------- */
  const CQ_CODE = {
    pseudo: [
      "enqueue(x):",
      "  if size == cap: grow or fail",
      "  buf[(front + size) % cap] ← x",
      "  size ← size + 1",
      "",
      "dequeue():",
      "  if size == 0: fail",
      "  x ← buf[front]",
      "  front ← (front + 1) % cap",
      "  size ← size - 1",
      "  return x",
    ],
    java: [
      "void enqueue(int x) {",
      "  if (size == cap) grow();",
      "  buf[(front + size) % cap] = x;",
      "  size++;",
      "}",
      "",
      "int dequeue() {",
      "  if (size == 0) throw new NoSuchElementException();",
      "  int x = buf[front];",
      "  front = (front + 1) % cap;",
      "  size--;",
      "  return x;",
      "}",
    ],
    cpp: [
      "void enqueue(int x) {",
      "  if (size == cap) grow();",
      "  buf[(front + size) % cap] = x;",
      "  size++;",
      "}",
      "",
      "int dequeue() {",
      "  if (size == 0) throw runtime_error(\"empty\");",
      "  int x = buf[front];",
      "  front = (front + 1) % cap;",
      "  size--;",
      "  return x;",
      "}",
    ],
    python: [
      "def enqueue(self, x):",
      "  if self.size == self.cap:",
      "    self.grow()",
      "  self.buf[(self.front + self.size) % self.cap] = x",
      "  self.size += 1",
      "",
      "def dequeue(self):",
      "  if self.size == 0:",
      "    raise IndexError('queue is empty')",
      "  x = self.buf[self.front]",
      "  self.front = (self.front + 1) % self.cap",
      "  self.size -= 1",
      "  return x",
    ],
  };

  document.addEventListener("DOMContentLoaded", function () {
    player = new D.Player({ mount: "#player", render: render });
    D.CodeBlock("#cq-code", CQ_CODE);
    const val = () => { const v = parseInt(q("val").value, 10); return isNaN(v) ? D.randInt(10, 99) : v; };
    const run = (fr) => player.load(fr, true);

    const PANELS = ["tools-stack", "tools-queue", "tools-deque", "tools-app"];
    const BLURB = {
      stack: "A <b>stack</b> is LIFO — every operation happens at the top, so all of push, pop and peek are O(1). " +
        "Method calls, undo histories, expression parsing and DFS all run on stacks.",
      queue: "A <b>queue</b> is FIFO. Implemented as a circular array it keeps <span class='mono'>front</span> and " +
        "<span class='mono'>size</span> and wraps with modulo, so enqueue and dequeue are O(1) with no shifting.",
      deque: "A <b>deque</b> (double-ended queue) allows insertion and removal at both ends in O(1). It subsumes " +
        "both stack and queue, which is why <span class='mono'>ArrayDeque</span> is the recommended Java stack.",
      app: "Two classic stack applications. Both work because a stack captures <em>nesting</em>: the most recently " +
        "opened thing is the first that has to be resolved.",
    };

    D.Tabs("#tabs", [
      { id: "stack", label: "Stack" },
      { id: "queue", label: "Queue (circular)" },
      { id: "deque", label: "Deque" },
      { id: "app", label: "Applications" },
    ], (id) => {
      mode = id;
      PANELS.forEach((p) => (q(p).style.display = "none"));
      q("tools-" + id).style.display = "flex";
      q("blurb").innerHTML = BLURB[id];
      if (id === "stack") player.load([stackF.snapshot({}, "An array-backed stack with " + S.items.length + " element(s). Capacity " + S.cap + ".")], false);
      else if (id === "queue") player.load([ringSnapshot("queue", Q, {}, "A circular queue holding " + Q.size + " element(s).")], false);
      else if (id === "deque") player.load([ringSnapshot("deque", K, {}, "A circular deque holding " + K.size + " element(s).")], false);
      else player.load([{ kind: "brackets", str: q("bstr").value, i: -1, stack: [], marks: {}, note: "Press <b>Check brackets</b> or <b>Evaluate</b>." }], false);
    });

    /* stack */
    q("s-push").addEventListener("click", () => run(stackF.push(val())));
    q("s-pop").addEventListener("click", () => run(stackF.pop()));
    q("s-peek").addEventListener("click", () => run(stackF.peek()));
    q("s-clear").addEventListener("click", () => { S.items = []; player.load([stackF.snapshot({}, "Cleared — <span class='mono'>top = -1</span>.")], false); });

    /* queue */
    q("q-enq").addEventListener("click", () => run(queueF.enqueue(val())));
    q("q-deq").addEventListener("click", () => run(queueF.dequeue()));
    q("q-peek").addEventListener("click", () => run(queueF.peek()));
    q("q-clear").addEventListener("click", () => { Q.buf = new Array(CAP).fill(null); Q.front = 0; Q.size = 0; player.load([ringSnapshot("queue", Q, {}, "Cleared.")], false); });
    q("q-wrap").addEventListener("click", () => {
      /* fill, drain 3, then fill again so the indices visibly wrap */
      Q.buf = new Array(CAP).fill(null); Q.front = 0; Q.size = 0;
      const all = [];
      [11, 22, 33, 44, 55].forEach((v) => queueF.enqueue(v).forEach((f) => all.push(f)));
      for (let i = 0; i < 3; i++) queueF.dequeue().forEach((f) => all.push(f));
      [66, 77, 88, 99].forEach((v) => queueF.enqueue(v).forEach((f) => all.push(f)));
      player.load(all, true);
      D.toast("Watch index 0 get reused once the rear passes the end.");
    });

    /* deque */
    q("k-af").addEventListener("click", () => run(dequeF.addFirst(val())));
    q("k-al").addEventListener("click", () => run(dequeF.addLast(val())));
    q("k-rf").addEventListener("click", () => run(dequeF.removeFirst()));
    q("k-rl").addEventListener("click", () => run(dequeF.removeLast()));
    q("k-clear").addEventListener("click", () => { K.buf = new Array(CAP).fill(null); K.front = 0; K.size = 0; player.load([ringSnapshot("deque", K, {}, "Cleared.")], false); });

    /* applications */
    q("a-brackets").addEventListener("click", () => {
      const s = (q("bstr").value || "").trim();
      if (!s) return D.toast("Type an expression first.", true);
      run(brackets(s));
    });
    q("a-postfix").addEventListener("click", () => {
      const s = (q("pstr").value || "").trim();
      if (!s) return D.toast("Type a postfix expression first.", true);
      run(postfix(s));
    });
    D.$$("[data-sample]").forEach((b) =>
      b.addEventListener("click", () => {
        const t = b.dataset.target;
        q(t).value = b.dataset.sample;
        (t === "bstr" ? q("a-brackets") : q("a-postfix")).click();
      })
    );

    /* seed data */
    S.items = [12, 45, 7];
    [5, 9, 14].forEach((v) => { Q.buf[(Q.front + Q.size) % Q.cap] = v; Q.size++; });
    [8, 3].forEach((v) => { K.buf[(K.front + K.size) % K.cap] = v; K.size++; });
    player.load([stackF.snapshot({}, "An array-backed stack with 3 elements. Capacity " + S.cap + ".")], false);
  });
})();
