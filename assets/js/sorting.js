/* ============================================================
   sorting.js — eight sorting algorithms, frame by frame
   Each algorithm gets (a, R, done, api) and records frames:
     { arr, marks, line, note, cmp, mov, rows? }
   ============================================================ */
(function () {
  "use strict";
  const D = window.DSA;

  /* ---------- listings ----------------------------------------
     Frames record a PSEUDOCODE line number, so every other language
     ships a `map` from pseudocode line → line in that listing.
     Leave a map out when the two line up one-for-one.
     ------------------------------------------------------------ */
  const CODE = {
    bubble: {
      pseudo: [
        "bubbleSort(A):",
        "  for i ← n-1 down to 1",
        "    swapped ← false",
        "    for j ← 0 to i-1",
        "      // compare neighbours",
        "      if A[j] > A[j+1]",
        "        swap A[j], A[j+1]",
        "        swapped ← true",
        "    if not swapped: break   // already sorted",
      ],
      java: [
        "static void bubbleSort(int[] a) {",
        "  for (int i = a.length - 1; i >= 1; i--) {",
        "    boolean swapped = false;",
        "    for (int j = 0; j < i; j++) {",
        "      // compare neighbours",
        "      if (a[j] > a[j + 1]) {",
        "        int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;",
        "        swapped = true;",
        "      }",
        "    }",
        "    if (!swapped) break;    // already sorted",
        "  }",
        "}",
      ],
      cpp: [
        "void bubbleSort(vector<int>& a) {",
        "  for (int i = (int)a.size() - 1; i >= 1; i--) {",
        "    bool swapped = false;",
        "    for (int j = 0; j < i; j++) {",
        "      // compare neighbours",
        "      if (a[j] > a[j + 1]) {",
        "        swap(a[j], a[j + 1]);",
        "        swapped = true;",
        "      }",
        "    }",
        "    if (!swapped) break;    // already sorted",
        "  }",
        "}",
      ],
      python: [
        "def bubble_sort(a):",
        "  for i in range(len(a) - 1, 0, -1):",
        "    swapped = False",
        "    for j in range(i):",
        "      # compare neighbours",
        "      if a[j] > a[j + 1]:",
        "        a[j], a[j + 1] = a[j + 1], a[j]",
        "        swapped = True",
        "    if not swapped:         # already sorted",
        "      break",
      ],
      map: {
        java: [0, 1, 2, 3, 4, 5, 6, 7, 10],
        cpp: [0, 1, 2, 3, 4, 5, 6, 7, 10],
      },
    },

    selection: {
      pseudo: [
        "selectionSort(A):",
        "  for i ← 0 to n-2",
        "    min ← i",
        "    for j ← i+1 to n-1",
        "      if A[j] < A[min]",
        "        min ← j",
        "    swap A[i], A[min]",
      ],
      java: [
        "static void selectionSort(int[] a) {",
        "  for (int i = 0; i < a.length - 1; i++) {",
        "    int min = i;",
        "    for (int j = i + 1; j < a.length; j++)",
        "      if (a[j] < a[min])",
        "        min = j;",
        "    int t = a[i]; a[i] = a[min]; a[min] = t;",
        "  }",
        "}",
      ],
      cpp: [
        "void selectionSort(vector<int>& a) {",
        "  for (int i = 0; i + 1 < (int)a.size(); i++) {",
        "    int min = i;",
        "    for (int j = i + 1; j < (int)a.size(); j++)",
        "      if (a[j] < a[min])",
        "        min = j;",
        "    swap(a[i], a[min]);",
        "  }",
        "}",
      ],
      python: [
        "def selection_sort(a):",
        "  for i in range(len(a) - 1):",
        "    m = i",
        "    for j in range(i + 1, len(a)):",
        "      if a[j] < a[m]:",
        "        m = j",
        "    a[i], a[m] = a[m], a[i]",
      ],
    },

    insertion: {
      pseudo: [
        "insertionSort(A):",
        "  for i ← 1 to n-1",
        "    key ← A[i];  j ← i-1",
        "    while j ≥ 0 and A[j] > key",
        "      A[j+1] ← A[j]      // shift right",
        "      j ← j-1",
        "    A[j+1] ← key       // drop it in",
      ],
      java: [
        "static void insertionSort(int[] a) {",
        "  for (int i = 1; i < a.length; i++) {",
        "    int key = a[i], j = i - 1;",
        "    while (j >= 0 && a[j] > key) {",
        "      a[j + 1] = a[j];      // shift right",
        "      j--;",
        "    }",
        "    a[j + 1] = key;         // drop it in",
        "  }",
        "}",
      ],
      cpp: [
        "void insertionSort(vector<int>& a) {",
        "  for (int i = 1; i < (int)a.size(); i++) {",
        "    int key = a[i], j = i - 1;",
        "    while (j >= 0 && a[j] > key) {",
        "      a[j + 1] = a[j];      // shift right",
        "      j--;",
        "    }",
        "    a[j + 1] = key;         // drop it in",
        "  }",
        "}",
      ],
      python: [
        "def insertion_sort(a):",
        "  for i in range(1, len(a)):",
        "    key, j = a[i], i - 1",
        "    while j >= 0 and a[j] > key:",
        "      a[j + 1] = a[j]       # shift right",
        "      j -= 1",
        "    a[j + 1] = key          # drop it in",
      ],
      map: {
        java: [0, 1, 2, 3, 4, 5, 7],
        cpp: [0, 1, 2, 3, 4, 5, 7],
      },
    },

    heap: {
      pseudo: [
        "heapSort(A):",
        "  // 1. build a max-heap bottom-up",
        "  for i ← ⌊n/2⌋-1 down to 0",
        "    downHeap(A, i, n)",
        "  // 2. pull the max to the back",
        "  for end ← n-1 down to 1",
        "    swap A[0], A[end]",
        "    downHeap(A, 0, end)",
        "",
        "downHeap(A, i, size):",
        "  while 2i+1 < size",
        "    c ← index of larger child",
        "    if A[i] ≥ A[c]: break",
        "    swap A[i], A[c];  i ← c",
      ],
      java: [
        "static void heapSort(int[] a) {",
        "  // 1. build a max-heap bottom-up",
        "  for (int i = a.length / 2 - 1; i >= 0; i--)",
        "    downHeap(a, i, a.length);",
        "  // 2. pull the max to the back",
        "  for (int end = a.length - 1; end >= 1; end--) {",
        "    int t = a[0]; a[0] = a[end]; a[end] = t;",
        "    downHeap(a, 0, end);",
        "  }",
        "}",
        "",
        "static void downHeap(int[] a, int i, int size) {",
        "  while (2 * i + 1 < size) {",
        "    int c = 2 * i + 1;",
        "    if (c + 1 < size && a[c + 1] > a[c]) c++;",
        "    if (a[i] >= a[c]) break;",
        "    int t = a[i]; a[i] = a[c]; a[c] = t;",
        "    i = c;",
        "  }",
        "}",
      ],
      cpp: [
        "void downHeap(vector<int>& a, int i, int size) {",
        "  while (2 * i + 1 < size) {",
        "    int c = 2 * i + 1;",
        "    if (c + 1 < size && a[c + 1] > a[c]) c++;",
        "    if (a[i] >= a[c]) break;",
        "    swap(a[i], a[c]);",
        "    i = c;",
        "  }",
        "}",
        "",
        "void heapSort(vector<int>& a) {",
        "  // 1. build a max-heap bottom-up",
        "  for (int i = (int)a.size() / 2 - 1; i >= 0; i--)",
        "    downHeap(a, i, a.size());",
        "  // 2. pull the max to the back",
        "  for (int end = (int)a.size() - 1; end >= 1; end--) {",
        "    swap(a[0], a[end]);",
        "    downHeap(a, 0, end);",
        "  }",
        "}",
      ],
      python: [
        "def heap_sort(a):",
        "  # 1. build a max-heap bottom-up",
        "  for i in range(len(a) // 2 - 1, -1, -1):",
        "    down_heap(a, i, len(a))",
        "  # 2. pull the max to the back",
        "  for end in range(len(a) - 1, 0, -1):",
        "    a[0], a[end] = a[end], a[0]",
        "    down_heap(a, 0, end)",
        "",
        "def down_heap(a, i, size):",
        "  while 2 * i + 1 < size:",
        "    c = 2 * i + 1",
        "    if c + 1 < size and a[c + 1] > a[c]:",
        "      c += 1",
        "    if a[i] >= a[c]:",
        "      break",
        "    a[i], a[c] = a[c], a[i]",
        "    i = c",
      ],
      map: {
        java: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 15, 16],
        cpp: [10, 11, 12, 13, 14, 15, 16, 17, 9, 0, 1, 2, 4, 5],
        python: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 16],
      },
    },

    merge: {
      pseudo: [
        "mergeSort(A, lo, hi):",
        "  if lo ≥ hi: return       // size ≤ 1",
        "  mid ← ⌊(lo+hi)/2⌋",
        "  mergeSort(A, lo, mid)",
        "  mergeSort(A, mid+1, hi)",
        "  merge(A, lo, mid, hi)",
        "",
        "merge(A, lo, mid, hi):",
        "  L ← A[lo..mid],  R ← A[mid+1..hi]",
        "  i ← 0, j ← 0, k ← lo",
        "  while i < |L| and j < |R|",
        "    A[k++] ← (L[i] ≤ R[j]) ? L[i++] : R[j++]",
        "  copy the remaining side back into A",
      ],
      java: [
        "static void mergeSort(int[] a, int lo, int hi) {",
        "  if (lo >= hi) return;                // size <= 1",
        "  int mid = (lo + hi) / 2;",
        "  mergeSort(a, lo, mid);",
        "  mergeSort(a, mid + 1, hi);",
        "  merge(a, lo, mid, hi);",
        "}",
        "",
        "static void merge(int[] a, int lo, int mid, int hi) {",
        "  int[] L = Arrays.copyOfRange(a, lo, mid + 1);",
        "  int[] R = Arrays.copyOfRange(a, mid + 1, hi + 1);",
        "  int i = 0, j = 0, k = lo;",
        "  while (i < L.length && j < R.length)",
        "    a[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];",
        "  while (i < L.length) a[k++] = L[i++];",
        "  while (j < R.length) a[k++] = R[j++];",
        "}",
      ],
      cpp: [
        "void merge(vector<int>& a, int lo, int mid, int hi) {",
        "  vector<int> L(a.begin() + lo, a.begin() + mid + 1);",
        "  vector<int> R(a.begin() + mid + 1, a.begin() + hi + 1);",
        "  int i = 0, j = 0, k = lo;",
        "  while (i < (int)L.size() && j < (int)R.size())",
        "    a[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];",
        "  while (i < (int)L.size()) a[k++] = L[i++];",
        "  while (j < (int)R.size()) a[k++] = R[j++];",
        "}",
        "",
        "void mergeSort(vector<int>& a, int lo, int hi) {",
        "  if (lo >= hi) return;                // size <= 1",
        "  int mid = (lo + hi) / 2;",
        "  mergeSort(a, lo, mid);",
        "  mergeSort(a, mid + 1, hi);",
        "  merge(a, lo, mid, hi);",
        "}",
      ],
      python: [
        "def merge_sort(a, lo, hi):",
        "  if lo >= hi:                       # size <= 1",
        "    return",
        "  mid = (lo + hi) // 2",
        "  merge_sort(a, lo, mid)",
        "  merge_sort(a, mid + 1, hi)",
        "  merge(a, lo, mid, hi)",
        "",
        "def merge(a, lo, mid, hi):",
        "  L, R = a[lo:mid + 1], a[mid + 1:hi + 1]",
        "  i = j = 0",
        "  k = lo",
        "  while i < len(L) and j < len(R):",
        "    if L[i] <= R[j]:",
        "      a[k], i = L[i], i + 1",
        "    else:",
        "      a[k], j = R[j], j + 1",
        "    k += 1",
        "  a[k:hi + 1] = L[i:] + R[j:]        # whichever side is left",
      ],
      map: {
        java: [0, 1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 14],
        cpp: [10, 11, 12, 13, 14, 15, 9, 0, 1, 3, 4, 5, 6],
        python: [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 18],
      },
    },

    quick: {
      pseudo: [
        "quickSort(A, lo, hi):",
        "  if lo ≥ hi: return",
        "  p ← partition(A, lo, hi)",
        "  quickSort(A, lo, p-1)",
        "  quickSort(A, p+1, hi)",
        "",
        "partition(A, lo, hi):   // Lomuto, pivot = A[hi]",
        "  pivot ← A[hi];  i ← lo",
        "  for j ← lo to hi-1",
        "    if A[j] < pivot",
        "      swap A[i], A[j];  i ← i+1",
        "  swap A[i], A[hi]      // pivot lands at i",
        "  return i",
      ],
      java: [
        "static void quickSort(int[] a, int lo, int hi) {",
        "  if (lo >= hi) return;",
        "  int p = partition(a, lo, hi);",
        "  quickSort(a, lo, p - 1);",
        "  quickSort(a, p + 1, hi);",
        "}",
        "",
        "static int partition(int[] a, int lo, int hi) {   // Lomuto",
        "  int pivot = a[hi], i = lo;",
        "  for (int j = lo; j < hi; j++)",
        "    if (a[j] < pivot) {",
        "      int t = a[i]; a[i] = a[j]; a[j] = t;  i++;",
        "    }",
        "  int tmp = a[i]; a[i] = a[hi]; a[hi] = tmp;  // pivot to i",
        "  return i;",
        "}",
      ],
      cpp: [
        "int partition(vector<int>& a, int lo, int hi) {   // Lomuto",
        "  int pivot = a[hi], i = lo;",
        "  for (int j = lo; j < hi; j++)",
        "    if (a[j] < pivot) {",
        "      swap(a[i], a[j]);  i++;",
        "    }",
        "  swap(a[i], a[hi]);                // pivot lands at i",
        "  return i;",
        "}",
        "",
        "void quickSort(vector<int>& a, int lo, int hi) {",
        "  if (lo >= hi) return;",
        "  int p = partition(a, lo, hi);",
        "  quickSort(a, lo, p - 1);",
        "  quickSort(a, p + 1, hi);",
        "}",
      ],
      python: [
        "def quick_sort(a, lo, hi):",
        "  if lo >= hi:",
        "    return",
        "  p = partition(a, lo, hi)",
        "  quick_sort(a, lo, p - 1)",
        "  quick_sort(a, p + 1, hi)",
        "",
        "def partition(a, lo, hi):           # Lomuto, pivot = a[hi]",
        "  pivot, i = a[hi], lo",
        "  for j in range(lo, hi):",
        "    if a[j] < pivot:",
        "      a[i], a[j] = a[j], a[i]",
        "      i += 1",
        "  a[i], a[hi] = a[hi], a[i]         # pivot lands at i",
        "  return i",
      ],
      map: {
        java: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14],
        cpp: [10, 11, 12, 13, 14, 9, 0, 1, 2, 3, 4, 6, 7],
        python: [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14],
      },
    },

    twothird: {
      pseudo: [
        "twoThirdSort(A, i, j):",
        "  if A[i] > A[j]: swap A[i], A[j]",
        "  if j - i + 1 > 2",
        "    t ← ⌊(j - i + 1) / 3⌋",
        "    twoThirdSort(A, i,   j-t)   // first 2/3",
        "    twoThirdSort(A, i+t, j  )   // last  2/3",
        "    twoThirdSort(A, i,   j-t)   // first 2/3 again",
      ],
      java: [
        "static void twoThirdSort(int[] a, int i, int j) {",
        "  if (a[i] > a[j]) { int tmp=a[i]; a[i]=a[j]; a[j]=tmp; }",
        "  if (j - i + 1 > 2) {",
        "    int t = (j - i + 1) / 3;",
        "    twoThirdSort(a, i,     j - t);   // first 2/3",
        "    twoThirdSort(a, i + t, j    );   // last  2/3",
        "    twoThirdSort(a, i,     j - t);   // first 2/3 again",
        "  }",
        "}",
      ],
      cpp: [
        "void twoThirdSort(vector<int>& a, int i, int j) {",
        "  if (a[i] > a[j]) swap(a[i], a[j]);",
        "  if (j - i + 1 > 2) {",
        "    int t = (j - i + 1) / 3;",
        "    twoThirdSort(a, i,     j - t);   // first 2/3",
        "    twoThirdSort(a, i + t, j    );   // last  2/3",
        "    twoThirdSort(a, i,     j - t);   // first 2/3 again",
        "  }",
        "}",
      ],
      python: [
        "def two_third_sort(a, i, j):",
        "  if a[i] > a[j]:",
        "    a[i], a[j] = a[j], a[i]",
        "  if j - i + 1 > 2:",
        "    t = (j - i + 1) // 3",
        "    two_third_sort(a, i,     j - t)   # first 2/3",
        "    two_third_sort(a, i + t, j    )   # last  2/3",
        "    two_third_sort(a, i,     j - t)   # first 2/3 again",
      ],
      map: {
        python: [0, 1, 3, 4, 5, 6, 7],
      },
    },

    counting: {
      pseudo: [
        "countingSort(A, k):      // values in 0..k",
        "  C ← array of k+1 zeros",
        "  for each x in A:  C[x] ← C[x] + 1",
        "  for v ← 1 to k:   C[v] ← C[v] + C[v-1]",
        "  // right-to-left keeps equal keys stable",
        "  for idx ← n-1 down to 0",
        "    C[A[idx]] ← C[A[idx]] - 1",
        "    B[ C[A[idx]] ] ← A[idx]",
        "  copy B back into A",
      ],
      java: [
        "static void countingSort(int[] a, int k) {   // values in 0..k",
        "  int[] C = new int[k + 1];",
        "  for (int x : a) C[x]++;",
        "  for (int v = 1; v <= k; v++) C[v] += C[v - 1];",
        "  int[] B = new int[a.length];",
        "  // right-to-left keeps equal keys stable",
        "  for (int idx = a.length - 1; idx >= 0; idx--) {",
        "    C[a[idx]]--;",
        "    B[C[a[idx]]] = a[idx];",
        "  }",
        "  System.arraycopy(B, 0, a, 0, a.length);",
        "}",
      ],
      cpp: [
        "void countingSort(vector<int>& a, int k) {   // values in 0..k",
        "  vector<int> C(k + 1, 0);",
        "  for (int x : a) C[x]++;",
        "  for (int v = 1; v <= k; v++) C[v] += C[v - 1];",
        "  vector<int> B(a.size());",
        "  // right-to-left keeps equal keys stable",
        "  for (int idx = (int)a.size() - 1; idx >= 0; idx--) {",
        "    C[a[idx]]--;",
        "    B[C[a[idx]]] = a[idx];",
        "  }",
        "  a = B;",
        "}",
      ],
      python: [
        "def counting_sort(a, k):              # values in 0..k",
        "  C = [0] * (k + 1)",
        "  for x in a:",
        "    C[x] += 1",
        "  for v in range(1, k + 1):",
        "    C[v] += C[v - 1]",
        "  B = [0] * len(a)",
        "  # right-to-left keeps equal keys stable",
        "  for idx in range(len(a) - 1, -1, -1):",
        "    C[a[idx]] -= 1",
        "    B[C[a[idx]]] = a[idx]",
        "  a[:] = B",
      ],
      map: {
        java: [0, 1, 2, 3, 5, 6, 7, 8, 10],
        cpp: [0, 1, 2, 3, 5, 6, 7, 8, 10],
        python: [0, 1, 2, 4, 7, 8, 9, 10, 11],
      },
    },
  };

  /* ---------- algorithms ---------- */
  const ALGO = {};

  ALGO.bubble = {
    label: "Bubble Sort",
    code: CODE.bubble,
    big: ["best Ω(n)", "avg Θ(n²)", "worst O(n²)", "space O(1)", "stable"],
    blurb:
      "Repeatedly walk the array swapping out-of-order neighbours. After pass <em>i</em> the largest <em>i</em> " +
      "values have bubbled to the back, so the pass gets shorter each time. If a whole pass makes no swap the array " +
      "is already sorted and we stop early — that is the best case Ω(n).",
    run(a, s) {
      const n = a.length;
      for (let i = n - 1; i >= 1; i--) {
        let swapped = false;
        s.snap({}, 2, "New pass. <b>swapped = false</b>; this pass scans j = 0 … " + (i - 1) + ".");
        for (let j = 0; j < i; j++) {
          s.cmp++;
          s.snap({ [j]: "cmp", [j + 1]: "cmp" }, 5, "Compare <b>A[" + j + "] = " + a[j] + "</b> with <b>A[" + (j + 1) + "] = " + a[j + 1] + "</b>.");
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            s.mov += 2;
            swapped = true;
            s.snap({ [j]: "swap", [j + 1]: "swap" }, 6, "Out of order — swap them. The bigger value keeps moving right.");
          }
        }
        s.done.add(i);
        s.snap({}, 8, "End of pass: <b>A[" + i + "] = " + a[i] + "</b> is now in its final place.");
        if (!swapped) {
          for (let k = 0; k < i; k++) s.done.add(k);
          s.snap({}, 8, "No swaps happened in that pass — the array is sorted, so bubble sort exits early.");
          break;
        }
      }
      for (let k = 0; k < n; k++) s.done.add(k);
    },
  };

  ALGO.selection = {
    label: "Selection Sort",
    code: CODE.selection,
    big: ["best Ω(n²)", "avg Θ(n²)", "worst O(n²)", "space O(1)", "not stable"],
    blurb:
      "Scan the unsorted tail for its minimum, then swap that minimum into the front of the tail. " +
      "It always does exactly n(n-1)/2 comparisons, but at most n-1 swaps — the fewest of any of the quadratic " +
      "sorts, which is why it is a decent choice when moving records is expensive.",
    run(a, s) {
      const n = a.length;
      for (let i = 0; i < n - 1; i++) {
        let min = i;
        s.snap({ [i]: "active", [min]: "target" }, 2, "Looking for the smallest value in A[" + i + "…" + (n - 1) + "]. Assume it is A[" + i + "].");
        for (let j = i + 1; j < n; j++) {
          s.cmp++;
          s.snap({ [j]: "cmp", [min]: "target", [i]: "active" }, 4, "Is A[" + j + "] = " + a[j] + " smaller than the current minimum " + a[min] + "?");
          if (a[j] < a[min]) {
            min = j;
            s.snap({ [min]: "target", [i]: "active" }, 5, "Yes — the new minimum is <b>A[" + min + "] = " + a[min] + "</b>.");
          }
        }
        if (min !== i) {
          [a[i], a[min]] = [a[min], a[i]];
          s.mov += 2;
          s.snap({ [i]: "swap", [min]: "swap" }, 6, "Swap the minimum into position " + i + ".");
        } else {
          s.snap({ [i]: "done" }, 6, "The minimum was already at position " + i + " — no swap needed.");
        }
        s.done.add(i);
      }
      s.done.add(n - 1);
      s.snap({}, 6, "Every prefix position holds its final value — sorted.");
    },
  };

  ALGO.insertion = {
    label: "Insertion Sort",
    code: CODE.insertion,
    big: ["best Ω(n)", "avg Θ(n²)", "worst O(n²)", "space O(1)", "stable"],
    blurb:
      "Grow a sorted prefix one element at a time: lift out A[i] as the <em>key</em>, shift every larger value in the " +
      "prefix one slot right, then drop the key into the gap. Nearly-sorted input barely shifts anything, so this is " +
      "the fastest of the simple sorts in practice and is what real libraries use for small subarrays.",
    run(a, s) {
      const n = a.length;
      s.done.add(0);
      s.snap({ 0: "done" }, 1, "A one-element prefix is trivially sorted. Start at i = 1.");
      for (let i = 1; i < n; i++) {
        const key = a[i];
        let j = i - 1;
        s.snap({ [i]: "active" }, 2, "Lift out <b>key = A[" + i + "] = " + key + "</b>, leaving a hole at " + i + ".", { key: key, hole: i });
        while (j >= 0 && a[j] > key) {
          s.cmp++;
          s.snap({ [j]: "cmp" }, 3, "A[" + j + "] = " + a[j] + " &gt; key " + key + " — it has to move right.", { key: key, hole: j + 1 });
          a[j + 1] = a[j];
          s.mov++;
          s.snap({ [j + 1]: "swap" }, 4, "Shift A[" + j + "] into slot " + (j + 1) + ".", { key: key, hole: j });
          j--;
        }
        if (j >= 0) {
          s.cmp++;
          s.snap({ [j]: "cmp" }, 3, "A[" + j + "] = " + a[j] + " ≤ key " + key + " — stop shifting.", { key: key, hole: j + 1 });
        }
        a[j + 1] = key;
        s.mov++;
        s.done.add(i);
        s.snap({ [j + 1]: "done" }, 6, "Drop the key into slot " + (j + 1) + ". The prefix A[0…" + i + "] is sorted.");
      }
    },
  };

  ALGO.heap = {
    label: "Heap Sort",
    code: CODE.heap,
    big: ["best Ω(n log n)", "avg Θ(n log n)", "worst O(n log n)", "space O(1)", "not stable"],
    blurb:
      "Two phases. First turn the whole array into a max-heap from the bottom up in O(n). Then repeatedly swap the " +
      "root (the maximum) with the last heap slot, shrink the heap by one, and sift the new root down. The array " +
      "splits into a heap at the front and a growing sorted suffix at the back — no extra memory at all.",
    run(a, s) {
      const n = a.length;
      const down = (i, size, lineBase) => {
        while (2 * i + 1 < size) {
          let c = 2 * i + 1;
          if (c + 1 < size) {
            s.cmp++;
            if (a[c + 1] > a[c]) c = c + 1;
          }
          s.cmp++;
          s.snap({ [i]: "active", [c]: "cmp" }, 11, "Sift down: compare A[" + i + "] = " + a[i] + " with its larger child A[" + c + "] = " + a[c] + ".", { heapSize: size });
          if (a[i] >= a[c]) {
            s.snap({ [i]: "active" }, 12, "Parent is already ≥ child — the heap property holds here. Stop.", { heapSize: size });
            break;
          }
          [a[i], a[c]] = [a[c], a[i]];
          s.mov += 2;
          s.snap({ [i]: "swap", [c]: "swap" }, 13, "Child is bigger — swap and keep sifting down from " + c + ".", { heapSize: size });
          i = c;
        }
      };
      s.snap({}, 1, "<b>Phase 1 — build a max-heap.</b> Every index &gt; ⌊n/2⌋-1 is a leaf, so start at ⌊n/2⌋-1 = " + (Math.floor(n / 2) - 1) + ".", { heapSize: n });
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        s.snap({ [i]: "active" }, 3, "Heapify the subtree rooted at " + i + ".", { heapSize: n });
        down(i, n);
      }
      s.snap({ 0: "target" }, 4, "The array is a max-heap: A[0] = " + a[0] + " is the largest value. <b>Phase 2 — extract.</b>", { heapSize: n });
      for (let end = n - 1; end >= 1; end--) {
        [a[0], a[end]] = [a[end], a[0]];
        s.mov += 2;
        s.done.add(end);
        s.snap({ 0: "swap", [end]: "swap" }, 6, "Swap the max to index " + end + " — that slot is final. The heap shrinks to size " + end + ".", { heapSize: end });
        down(0, end);
      }
      s.done.add(0);
      s.snap({}, 7, "Heap is empty and the whole array is sorted.", { heapSize: 0 });
    },
  };

  ALGO.merge = {
    label: "Merge Sort",
    code: CODE.merge,
    big: ["best Ω(n log n)", "avg Θ(n log n)", "worst O(n log n)", "space O(n)", "stable"],
    blurb:
      "Split in half, sort each half recursively, then merge the two sorted halves by repeatedly taking the smaller " +
      "front element. The merge needs a scratch buffer, which is the O(n) extra space. Because ties take from the " +
      "left buffer first, merge sort is stable — and its O(n log n) bound holds on every input.",
    run(a, s) {
      const merge = (lo, mid, hi, depth) => {
        const L = a.slice(lo, mid + 1), R = a.slice(mid + 1, hi + 1);
        let i = 0, j = 0, k = lo;
        const rows = () => [
          { label: "L (A[" + lo + ".." + mid + "])", arr: L, marks: { [i]: "active" } },
          { label: "R (A[" + (mid + 1) + ".." + hi + "])", arr: R, marks: { [j]: "cmp" } },
        ];
        s.snap(rangeMarks(lo, hi), 8, "Copy the two sorted halves into buffers <b>L</b> and <b>R</b>, then merge back into A[" + lo + "…" + hi + "].", { rows: rows() });
        while (i < L.length && j < R.length) {
          s.cmp++;
          const takeL = L[i] <= R[j];
          s.snap(Object.assign(rangeMarks(lo, hi), { [k]: "active" }), 11, "Compare front of L (" + L[i] + ") with front of R (" + R[j] + ") → take <b>" + (takeL ? "L" : "R") + "</b>.", { rows: rows() });
          a[k++] = takeL ? L[i++] : R[j++];
          s.mov++;
          s.snap(Object.assign(rangeMarks(lo, hi), { [k - 1]: "swap" }), 11, "Write " + a[k - 1] + " into A[" + (k - 1) + "].", { rows: rows() });
        }
        while (i < L.length) {
          a[k++] = L[i++]; s.mov++;
          s.snap(Object.assign(rangeMarks(lo, hi), { [k - 1]: "swap" }), 12, "R is exhausted — copy the rest of L: " + a[k - 1] + " → A[" + (k - 1) + "].", { rows: rows() });
        }
        while (j < R.length) {
          a[k++] = R[j++]; s.mov++;
          s.snap(Object.assign(rangeMarks(lo, hi), { [k - 1]: "swap" }), 12, "L is exhausted — copy the rest of R: " + a[k - 1] + " → A[" + (k - 1) + "].", { rows: rows() });
        }
        s.snap(rangeMarks(lo, hi, "done"), 12, "A[" + lo + "…" + hi + "] is merged and sorted (" + (hi - lo + 1) + " elements).");
      };
      const ms = (lo, hi, depth) => {
        if (lo >= hi) {
          if (lo === hi) s.snap({ [lo]: "done" }, 1, "A[" + lo + "] alone is already sorted — base case, return.");
          return;
        }
        const mid = Math.floor((lo + hi) / 2);
        s.snap(rangeMarks(lo, hi), 2, "Split A[" + lo + "…" + hi + "] at mid = " + mid + " (depth " + depth + ").");
        ms(lo, mid, depth + 1);
        ms(mid + 1, hi, depth + 1);
        merge(lo, mid, hi, depth);
      };
      const rangeMarks = (lo, hi, cls) => {
        const m = {};
        for (let t = lo; t <= hi; t++) m[t] = cls || "range";
        return m;
      };
      ms(0, a.length - 1, 0);
      for (let k = 0; k < a.length; k++) s.done.add(k);
      s.snap({}, 5, "Every level has been merged — the array is sorted.");
    },
  };

  ALGO.quick = {
    label: "Quick Sort",
    code: CODE.quick,
    big: ["best Ω(n log n)", "avg Θ(n log n)", "worst O(n²)", "space O(log n)", "not stable"],
    blurb:
      "Pick a pivot, partition the range so everything smaller sits left of it and everything larger sits right, " +
      "then recurse on the two sides. This version uses Lomuto partitioning with the last element as pivot: " +
      "<span class='mono'>i</span> marks the boundary of the &lt;-pivot region and <span class='mono'>j</span> " +
      "scans. Already-sorted input makes every partition maximally lopsided — that is the O(n²) worst case.",
    run(a, s) {
      const rangeMarks = (lo, hi) => { const m = {}; for (let t = lo; t <= hi; t++) m[t] = "range"; return m; };
      const part = (lo, hi) => {
        const pivot = a[hi];
        let i = lo;
        s.snap(Object.assign(rangeMarks(lo, hi), { [hi]: "pivot" }), 7, "Pivot = <b>A[" + hi + "] = " + pivot + "</b>. Boundary i = " + i + ".");
        for (let j = lo; j < hi; j++) {
          s.cmp++;
          s.snap(Object.assign(rangeMarks(lo, hi), { [hi]: "pivot", [j]: "cmp", [i]: "active" }), 9, "Is A[" + j + "] = " + a[j] + " &lt; pivot " + pivot + "?");
          if (a[j] < pivot) {
            if (i !== j) {
              [a[i], a[j]] = [a[j], a[i]];
              s.mov += 2;
              s.snap(Object.assign(rangeMarks(lo, hi), { [hi]: "pivot", [i]: "swap", [j]: "swap" }), 10, "Yes — swap it into the &lt;-pivot region and advance i to " + (i + 1) + ".");
            } else {
              s.snap(Object.assign(rangeMarks(lo, hi), { [hi]: "pivot", [i]: "swap" }), 10, "Yes — it is already at the boundary, just advance i to " + (i + 1) + ".");
            }
            i++;
          }
        }
        [a[i], a[hi]] = [a[hi], a[i]];
        s.mov += 2;
        s.done.add(i);
        s.snap(Object.assign(rangeMarks(lo, hi), { [i]: "done" }), 11, "Swap the pivot into the boundary: <b>A[" + i + "] = " + pivot + "</b> is now in its final position.");
        return i;
      };
      const qs = (lo, hi) => {
        if (lo >= hi) {
          if (lo === hi) { s.done.add(lo); s.snap({ [lo]: "done" }, 1, "A[" + lo + "] is a single element — base case."); }
          return;
        }
        s.snap(rangeMarks(lo, hi), 0, "quickSort on A[" + lo + "…" + hi + "].");
        const p = part(lo, hi);
        qs(lo, p - 1);
        qs(p + 1, hi);
      };
      qs(0, a.length - 1);
      for (let k = 0; k < a.length; k++) s.done.add(k);
      s.snap({}, 4, "All partitions are size ≤ 1 — the array is sorted.");
    },
  };

  ALGO.twothird = {
    label: "Two-Third Sort",
    code: CODE.twothird,
    big: ["Θ(n^2.71)", "space O(log n)", "not stable"],
    blurb:
      "A deliberately terrible sort that is great for practising recurrences. Swap the two ends if needed, then sort " +
      "the first two-thirds, the last two-thirds, and the first two-thirds <em>again</em>. The final repeat is what " +
      "makes it correct: the second call may push large values into the last third, so the first two-thirds must be " +
      "re-sorted. Three calls on 2n/3 elements gives T(n) = 3T(2n/3) + O(1) = " +
      "Θ(n<sup>log<sub>1.5</sub>3</sup>) ≈ Θ(n<sup>2.71</sup>).",
    maxN: 14,
    run(a, s) {
      const rangeMarks = (lo, hi) => { const m = {}; for (let t = lo; t <= hi; t++) m[t] = "range"; return m; };
      const rec = (i, j, depth) => {
        if (s.stop()) return;
        s.snap(rangeMarks(i, j), 0, "twoThirdSort(A, " + i + ", " + j + ") — " + (j - i + 1) + " elements, depth " + depth + ".");
        s.cmp++;
        s.snap(Object.assign(rangeMarks(i, j), { [i]: "cmp", [j]: "cmp" }), 1, "Compare the two ends: A[" + i + "] = " + a[i] + " and A[" + j + "] = " + a[j] + ".");
        if (a[i] > a[j]) {
          [a[i], a[j]] = [a[j], a[i]];
          s.mov += 2;
          s.snap(Object.assign(rangeMarks(i, j), { [i]: "swap", [j]: "swap" }), 1, "Ends were out of order — swap them.");
        }
        if (j - i + 1 > 2) {
          const t = Math.floor((j - i + 1) / 3);
          s.snap(rangeMarks(i, j - t), 4, "t = " + t + ". Recurse on the <b>first two-thirds</b> A[" + i + "…" + (j - t) + "].");
          rec(i, j - t, depth + 1);
          s.snap(rangeMarks(i + t, j), 5, "Now the <b>last two-thirds</b> A[" + (i + t) + "…" + j + "] — this pulls the big values to the back.");
          rec(i + t, j, depth + 1);
          s.snap(rangeMarks(i, j - t), 6, "And the <b>first two-thirds again</b> — the previous call may have disturbed it.");
          rec(i, j - t, depth + 1);
        }
      };
      rec(0, a.length - 1, 0);
      for (let k = 0; k < a.length; k++) s.done.add(k);
      s.snap({}, 6, "Sorted — in a spectacularly inefficient number of steps.");
    },
  };

  ALGO.counting = {
    label: "Counting Sort",
    code: CODE.counting,
    big: ["Θ(n + k)", "space O(n + k)", "stable", "not comparison-based"],
    blurb:
      "No comparisons at all. Count how many times each key 0..k occurs, turn those counts into running totals " +
      "(so C[v] is where the block of v's ends), then walk the input from the right placing each element at " +
      "C[key]-1. Linear in n + k — brilliant for small key ranges, useless when k is huge. Walking right-to-left " +
      "is what makes it stable.",
    kRange: true,
    run(a, s) {
      const n = a.length, k = Math.max.apply(null, a);
      const C = new Array(k + 1).fill(0);
      const B = new Array(n).fill(null);
      const rows = (cm, bm) => [
        { label: "C (counts, index = key)", arr: C, marks: cm || {}, showIndex: true },
        { label: "B (output)", arr: B, marks: bm || {} },
      ];
      s.snap({}, 1, "Keys range over 0…" + k + ", so C has " + (k + 1) + " slots, all zero.", { rows: rows() });
      for (let i = 0; i < n; i++) {
        C[a[i]]++;
        s.mov++;
        s.snap({ [i]: "active" }, 2, "Saw key " + a[i] + " — bump <b>C[" + a[i] + "]</b> to " + C[a[i]] + ".", { rows: rows({ [a[i]]: "swap" }) });
      }
      s.snap({}, 2, "Counting pass done. C now holds the frequency of every key.", { rows: rows() });
      for (let v = 1; v <= k; v++) {
        C[v] += C[v - 1];
        s.snap({}, 3, "Prefix sum: <b>C[" + v + "] = " + C[v] + "</b> — that many elements are ≤ " + v + ".", { rows: rows({ [v]: "swap", [v - 1]: "cmp" }) });
      }
      s.snap({}, 4, "C is now a set of end-positions. Walk the input from the right to stay stable.", { rows: rows() });
      for (let i = n - 1; i >= 0; i--) {
        const key = a[i];
        C[key]--;
        B[C[key]] = key;
        s.mov++;
        s.snap({ [i]: "active" }, 6, "A[" + i + "] = " + key + " → C[" + key + "] drops to " + C[key] + ", so place it at <b>B[" + C[key] + "]</b>.", { rows: rows({ [key]: "cmp" }, { [C[key]]: "swap" }) });
      }
      for (let i = 0; i < n; i++) {
        a[i] = B[i];
        s.done.add(i);
        s.snap({ [i]: "done" }, 8, "Copy B[" + i + "] = " + B[i] + " back into A[" + i + "].", { rows: rows({}, { [i]: "done" }) });
      }
      s.snap({}, 8, "Sorted with zero comparisons in Θ(n + k) = Θ(" + n + " + " + k + ").", { rows: rows() });
    },
  };

  /* ---------- page wiring ---------- */
  const ORDER = ["bubble", "selection", "insertion", "heap", "merge", "quick", "twothird", "counting"];
  let arr = [], barsEl = null, code = null, cur = "bubble";

  const q = (id) => D.$("#" + id);

  function buildBars(len) {
    barsEl.innerHTML = "";
    for (let i = 0; i < len; i++) {
      const b = D.el("div", { class: "bar" }, [D.el("span", { class: "lbl" })]);
      barsEl.appendChild(b);
    }
    barsEl.classList.toggle("labeled", len <= 32);
  }

  function cellsRow(row, max) {
    const wrap = D.el("div", { style: "margin-top:1rem" });
    wrap.appendChild(D.el("div", { class: "small muted", text: row.label, style: "margin-bottom:.15rem" }));
    const cells = D.el("div", { class: "cells" });
    row.arr.forEach((v, i) => {
      const c = D.el("div", { class: "cell " + (row.marks[i] || "") + (v == null ? " empty" : " filled"), text: v == null ? "·" : v });
      if (row.showIndex !== false) c.appendChild(D.el("span", { class: "idx", text: i }));
      cells.appendChild(c);
    });
    wrap.appendChild(cells);
    return wrap;
  }

  const player = new D.Player({
    mount: "#player",
    render(f) {
      if (!f.arr) return;
      if (barsEl.children.length !== f.arr.length) buildBars(f.arr.length);
      const max = Math.max(1, Math.max.apply(null, f.arr));
      for (let i = 0; i < f.arr.length; i++) {
        const b = barsEl.children[i];
        b.className = "bar " + (f.marks && f.marks[i] ? f.marks[i] : "");
        b.style.height = Math.max(2, (f.arr[i] / max) * 100) + "%";
        b.firstChild.textContent = f.arr.length <= 32 ? f.arr[i] : "";
      }
      /* heap-sort boundary */
      const hb = q("heapline");
      if (f.heapSize != null && f.arr.length) {
        hb.style.display = "block";
        hb.textContent = "heap region: A[0…" + Math.max(0, f.heapSize - 1) + "]   sorted suffix: A[" + f.heapSize + "…" + (f.arr.length - 1) + "]";
      } else hb.style.display = "none";

      q("rows").innerHTML = "";
      (f.rows || []).forEach((r) => q("rows").appendChild(cellsRow(r)));

      q("s-cmp").textContent = f.cmp == null ? "–" : f.cmp;
      q("s-mov").textContent = f.mov == null ? "–" : f.mov;
      if (code && f.line != null) code.highlight(f.line);
    },
  });

  function drawStatic() {
    player.load([{ arr: arr.slice(), marks: {}, cmp: 0, mov: 0, note: "Array loaded — press <b>Run</b> (or Play) to sort it." }], false);
  }

  function selectAlgo(id) {
    cur = id;
    const A = ALGO[id];
    q("algo-name").textContent = A.label;
    q("algo-blurb").innerHTML = A.blurb;
    q("algo-big").innerHTML = A.big.map((b) => "<span>" + b + "</span>").join("");
    code = D.CodeBlock("#code", A.code);
    D.$$("#algo-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    if (A.maxN && arr.length > A.maxN) {
      newArray(A.maxN, "random");
      D.toast(A.label + " explodes combinatorially — trimmed to " + A.maxN + " elements.");
      return;
    }
    if (A.kRange) { regenForCounting(); return; }
    drawStatic();
  }

  function regenForCounting() {
    const maxV = 9;
    if (Math.max.apply(null, arr) > 20) {
      arr = arr.map(() => D.randInt(0, maxV));
      q("custom").value = arr.join(", ");
      D.toast("Counting sort needs a small key range — regenerated with keys 0–9.");
    }
    drawStatic();
  }

  function newArray(n, kind) {
    n = D.clamp(n, 3, 60);
    const A = ALGO[cur];
    if (A.maxN) n = Math.min(n, A.maxN);
    const hi = A.kRange ? 9 : 99, lo = A.kRange ? 0 : 5;
    if (kind === "sorted") arr = Array.from({ length: n }, (_, i) => lo + Math.round((i * (hi - lo)) / (n - 1)));
    else if (kind === "reverse") arr = Array.from({ length: n }, (_, i) => hi - Math.round((i * (hi - lo)) / (n - 1)));
    else if (kind === "nearly") {
      arr = Array.from({ length: n }, (_, i) => lo + Math.round((i * (hi - lo)) / (n - 1)));
      for (let s = 0; s < Math.max(1, Math.round(n / 8)); s++) {
        const i = D.randInt(0, n - 2);
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
      }
    } else if (kind === "few") arr = Array.from({ length: n }, () => [lo, Math.round((lo + hi) / 2), hi][D.randInt(0, 2)]);
    else arr = D.randArray(n, lo, hi);
    q("size").value = n;
    q("size-out").textContent = n;
    q("custom").value = arr.join(", ");
    drawStatic();
  }

  function run() {
    const A = ALGO[cur];
    const a = arr.slice();
    if (!a.length) { D.toast("Nothing to sort.", true); return; }
    const R = new D.Recorder(9000);
    const s = {
      cmp: 0, mov: 0, done: new Set(),
      stop: () => R.overflow,
      snap(marks, line, note, extra) {
        const m = {};
        this.done.forEach((i) => (m[i] = "done"));
        Object.assign(m, marks || {});
        R.push(Object.assign({ arr: a.slice(), marks: m, line: line, note: note, cmp: this.cmp, mov: this.mov }, extra || {}));
      },
    };
    s.snap({}, 0, "Start <b>" + A.label + "</b> on " + a.length + " elements.");
    A.run(a, s);
    if (R.overflow) D.toast("Step limit reached — try a smaller array.", true);
    q("s-frames").textContent = R.frames.length;
    arr = a.slice();
    q("custom").value = arr.join(", ");
    player.load(R.frames, true);
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    barsEl = q("bars");
    const tabs = q("algo-tabs");
    ORDER.forEach((id) => {
      tabs.appendChild(D.el("button", { text: ALGO[id].label, "data-id": id, onclick: () => selectAlgo(id) }));
    });
    q("size").addEventListener("input", (e) => { q("size-out").textContent = e.target.value; });
    q("size").addEventListener("change", (e) => newArray(+e.target.value, q("kind").value));
    q("kind").addEventListener("change", () => newArray(+q("size").value, q("kind").value));
    q("btn-new").addEventListener("click", () => newArray(+q("size").value, q("kind").value));
    q("btn-run").addEventListener("click", run);
    q("btn-load").addEventListener("click", () => {
      const v = D.parseNums(q("custom").value).filter((x) => x >= 0).slice(0, 60);
      if (v.length < 2) { D.toast("Enter at least two non-negative numbers.", true); return; }
      arr = v;
      q("size").value = Math.min(60, v.length);
      q("size-out").textContent = v.length;
      drawStatic();
      D.toast("Loaded " + v.length + " values.");
    });
    D.legend("#legend", [
      { color: "var(--c-idle)", label: "unsorted" },
      { color: "#5d6ea3", label: "active subarray" },
      { color: "var(--c-cmp)", label: "comparing" },
      { color: "var(--c-swap)", label: "moving / writing" },
      { color: "var(--c-active)", label: "cursor" },
      { color: "var(--c-pivot)", label: "pivot" },
      { color: "var(--c-target)", label: "current min" },
      { color: "var(--c-done)", label: "final position" },
    ]);
    arr = D.randArray(20, 5, 99);
    selectAlgo("bubble");
    newArray(20, "random");
  });
})();
