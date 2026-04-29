(() => {
    const $ = (s) => document.querySelector(s);

    // UI
    const boardEl = $("#board");
    const algoEl = $("#algo");
    const btnRun = $("#btnRun");
    const btnClearPath = $("#btnClearPath");
    const btnClearAll = $("#btnClearAll");
    const btnRandom = $("#btnRandom");

    const toolBtns = Array.from(document.querySelectorAll(".segBtn"));
    const chkDiagonal = $("#chkDiagonal");
    const chkAllowWeight = $("#chkAllowWeight");

    const speed = $("#speed");
    const speedText = $("#speedText");

    const visitedCnt = $("#visitedCnt");
    const pathLen = $("#pathLen");
    const pathCost = $("#pathCost");

    const toast = $("#toast");

    // Grid size (nice defaults; responsive via CSS aspect-ratio)
    const COLS = 42;
    const ROWS = 26;

    boardEl.style.setProperty("--cols", String(COLS));
    boardEl.style.setProperty("--rows", String(ROWS));

    // Node types
    const TYPE = {
        EMPTY: 0,
        WALL: 1,
        WEIGHT: 2,
    };

    // State
    let grid = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(TYPE.EMPTY));
    let start = { r: 3, c: 3 };                 // 左上（留一格边）
    let end   = { r: ROWS - 4, c: COLS - 4 };   // 右下（留一格边）

    let tool = "wall"; // wall | erase | weight | move
    let running = false;
    let pointerDown = false;

    // dragging start/end
    let dragNode = null; // "start" | "end" | null

    // For animation
    let lastRun = null; // { visitedOrder: [], cameFrom: Map, endKey, costMap: Map }
    let animTimer = null;

    function keyOf(r, c) { return `${r},${c}`; }
    function parseKey(k) { const [r, c] = k.split(",").map(Number); return { r, c }; }
    function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS; }

    function isStart(r, c) { return r === start.r && c === start.c; }
    function isEnd(r, c) { return r === end.r && c === end.c; }

    function clearToast() {
        toast.classList.remove("show");
        toast.setAttribute("aria-hidden", "true");
    }
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        toast.setAttribute("aria-hidden", "false");
        setTimeout(clearToast, 1600);
    }

    function resetStats() {
        visitedCnt.textContent = "0";
        pathLen.textContent = "0";
        pathCost.textContent = "0";
    }

    // --- Rendering ---
    function buildBoardDOM() {
        boardEl.innerHTML = "";
        const frag = document.createDocumentFragment();

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.dataset.r = String(r);
                cell.dataset.c = String(c);
                frag.appendChild(cell);
            }
        }
        boardEl.appendChild(frag);
        renderAll();
    }

    function cellEl(r, c) {
        return boardEl.children[r * COLS + c];
    }

    function renderCell(r, c) {
        const el = cellEl(r, c);
        el.className = "cell";

        const t = grid[r][c];
        if (t === TYPE.WALL) el.classList.add("wall");
        if (t === TYPE.WEIGHT) el.classList.add("weight");

        if (isStart(r, c)) el.classList.add("start");
        if (isEnd(r, c)) el.classList.add("end");
    }

    function renderAll() {
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) renderCell(r, c);
    }

    function clearPathVisual() {
        // remove visited/frontier/path classes only
        for (let i = 0; i < boardEl.children.length; i++) {
            const el = boardEl.children[i];
            el.classList.remove("visited", "frontier", "path");
        }
    }

    function clearAll() {
        stopAnim();
        running = false;
        grid = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(TYPE.EMPTY));
        clearPathVisual();
        renderAll();
        resetStats();
        showToast("已清空全部");
    }
    // NEW: 随机生成地图（墙 + 权重）
    function generateRandomMap({
        wallDensity = 0.22,      // 墙密度：0~0.45 比较舒服
        weightDensity = 0.08,    // 权重密度：0~0.20
        keepExisting = false,    // 是否在现有基础上叠加（默认否：重置再生成）
    } = {}) {
        if (running) return;

        stopAnim();
        clearPathVisual();
        resetStats();

        if (!keepExisting) {
            grid = new Array(ROWS).fill(0).map(() => new Array(COLS).fill(TYPE.EMPTY));
        }

        const allowWeight = chkAllowWeight.checked;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                // 保留起点/终点
                if (isStart(r, c) || isEnd(r, c)) {
                    grid[r][c] = TYPE.EMPTY;
                    continue;
                }

                // 若 keepExisting=true，则不覆盖已有墙（你也可以改成覆盖）
                if (keepExisting && grid[r][c] === TYPE.WALL) continue;

                const roll = Math.random();

                if (roll < wallDensity) {
                    grid[r][c] = TYPE.WALL;
                } else if (allowWeight && roll < wallDensity + weightDensity) {
                    grid[r][c] = TYPE.WEIGHT;
                } else {
                    grid[r][c] = TYPE.EMPTY;
                }
            }
        }

        renderAll();
        showToast("已随机生成地图");
    }

    // --- Tools ---
    function setTool(next) {
        tool = next;
        toolBtns.forEach(b => b.classList.toggle("active", b.dataset.tool === next));
        showToast(`工具：${next === "wall" ? "墙" : next === "erase" ? "橡皮" : next === "weight" ? "权重" : "拖拽点"}`);
    }

    function applyToolAt(r, c) {
        if (!inBounds(r, c)) return;
        if (isStart(r, c) || isEnd(r, c)) return;

        if (tool === "wall") {
            grid[r][c] = TYPE.WALL;
        } else if (tool === "erase") {
            grid[r][c] = TYPE.EMPTY;
        } else if (tool === "weight") {
            if (!chkAllowWeight.checked) return;
            grid[r][c] = (grid[r][c] === TYPE.WEIGHT) ? TYPE.EMPTY : TYPE.WEIGHT;
        }
        renderCell(r, c);
    }

    // --- Pathfinding core ---
    function neighbors(r, c) {
        const diag = chkDiagonal.checked;
        const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const dirs8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        const dirs = diag ? dirs8 : dirs4;

        const out = [];
        for (const [dr, dc] of dirs) {
            const nr = r + dr, nc = c + dc;
            if (!inBounds(nr, nc)) continue;
            if (grid[nr][nc] === TYPE.WALL) continue;

            // Optional: no corner cutting (diagonal through walls)
            if (diag && dr !== 0 && dc !== 0) {
                const r1 = r, c1 = c + dc;
                const r2 = r + dr, c2 = c;
                if (inBounds(r1, c1) && inBounds(r2, c2)) {
                    if (grid[r1][c1] === TYPE.WALL || grid[r2][c2] === TYPE.WALL) continue;
                }
            }
            out.push({ r: nr, c: nc, diag: dr !== 0 && dc !== 0 });
        }
        return out;
    }

    function stepCost(from, to) {
        // base cost: 1 (or sqrt2 for diag)
        const base = to.diag ? Math.SQRT2 : 1;
        const w = (grid[to.r][to.c] === TYPE.WEIGHT && chkAllowWeight.checked) ? 5 : 0;
        return base + w;
    }

    function heuristic(r, c) {
        // A*: Manhattan or Octile
        const dr = Math.abs(r - end.r);
        const dc = Math.abs(c - end.c);
        if (!chkDiagonal.checked) return dr + dc;
        // Octile distance
        const F = Math.SQRT2 - 1;
        return (dr < dc) ? F * dr + dc : F * dc + dr;
    }

    // Priority queue (binary heap)
    class MinHeap {
        constructor() { this.a = []; }
        push(x) { this.a.push(x); this._up(this.a.length - 1); }
        pop() {
            if (this.a.length === 0) return null;
            const top = this.a[0];
            const last = this.a.pop();
            if (this.a.length) { this.a[0] = last; this._down(0); }
            return top;
        }
        get size() { return this.a.length; }
        _up(i) {
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (this.a[p].pri <= this.a[i].pri) break;
                [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
                i = p;
            }
        }
        _down(i) {
            const n = this.a.length;
            while (true) {
                let l = i * 2 + 1, r = l + 1, m = i;
                if (l < n && this.a[l].pri < this.a[m].pri) m = l;
                if (r < n && this.a[r].pri < this.a[m].pri) m = r;
                if (m === i) break;
                [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
                i = m;
            }
        }
    }

    function runSearch() {
        stopAnim();
        clearPathVisual();
        resetStats();

        const algo = algoEl.value;
        const startK = keyOf(start.r, start.c);
        const endK = keyOf(end.r, end.c);

        const cameFrom = new Map();  // key -> prevKey
        const costSoFar = new Map(); // key -> g cost

        const visitedOrder = [];
        const frontierSet = new Set();

        // Helpers
        const markFrontier = (k) => frontierSet.add(k);
        const unmarkFrontier = (k) => frontierSet.delete(k);

        if (algo === "dfs") {
            // stack
            const st = [startK];
            const seen = new Set([startK]);
            markFrontier(startK);

            while (st.length) {
                const k = st.pop();
                unmarkFrontier(k);
                visitedOrder.push(k);
                if (k === endK) break;

                const { r, c } = parseKey(k);
                for (const nb of neighbors(r, c)) {
                    const nk = keyOf(nb.r, nb.c);
                    if (seen.has(nk)) continue;
                    seen.add(nk);
                    cameFrom.set(nk, k);
                    st.push(nk);
                    markFrontier(nk);
                }
            }

            // For dfs, cost isn't meaningful; still compute path length.
            costSoFar.set(startK, 0);
        } else if (algo === "bfs") {
            // queue
            const q = [startK];
            let qi = 0;
            const seen = new Set([startK]);
            markFrontier(startK);

            while (qi < q.length) {
                const k = q[qi++];
                unmarkFrontier(k);
                visitedOrder.push(k);
                if (k === endK) break;

                const { r, c } = parseKey(k);
                for (const nb of neighbors(r, c)) {
                    const nk = keyOf(nb.r, nb.c);
                    if (seen.has(nk)) continue;
                    seen.add(nk);
                    cameFrom.set(nk, k);
                    q.push(nk);
                    markFrontier(nk);
                }
            }
            costSoFar.set(startK, 0);
        } else {
            // Dijkstra / A*
            const pq = new MinHeap();
            pq.push({ k: startK, pri: 0 });
            costSoFar.set(startK, 0);
            markFrontier(startK);

            while (pq.size) {
                const cur = pq.pop();
                const k = cur.k;
                if (!costSoFar.has(k)) continue;

                unmarkFrontier(k);
                visitedOrder.push(k);
                if (k === endK) break;

                const { r, c } = parseKey(k);
                for (const nb of neighbors(r, c)) {
                    const nk = keyOf(nb.r, nb.c);
                    const newCost = costSoFar.get(k) + stepCost({ r, c }, nb);

                    if (!costSoFar.has(nk) || newCost < costSoFar.get(nk)) {
                        costSoFar.set(nk, newCost);
                        cameFrom.set(nk, k);

                        const h = (algo === "astar") ? heuristic(nb.r, nb.c) : 0;
                        pq.push({ k: nk, pri: newCost + h });
                        markFrontier(nk);
                    }
                }
            }
        }

        lastRun = { visitedOrder, cameFrom, startK, endK, costSoFar };
        animateResult();
    }

    function reconstructPath(cameFrom, startK, endK) {
        const path = [];
        let k = endK;
        if (k !== startK && !cameFrom.has(k)) return [];
        while (k && k !== startK) {
            path.push(k);
            k = cameFrom.get(k);
        }
        path.push(startK);
        path.reverse();
        return path;
    }

    function stopAnim() {
        if (animTimer) clearTimeout(animTimer);
        animTimer = null;
    }

    function animateResult() {
        if (!lastRun) return;
        running = true;
        btnRun.disabled = true;

        const delay = Number(speed.value) || 30;
        const { visitedOrder, cameFrom, startK, endK, costSoFar } = lastRun;

        let i = 0;

        const path = reconstructPath(cameFrom, startK, endK);
        const found = path.length > 0 && path[path.length - 1] === endK;

        const visitStep = () => {
            if (!running) return;

            // visiting phase
            if (i < visitedOrder.length) {
                const k = visitedOrder[i++];
                if (k !== startK && k !== endK) {
                    const { r, c } = parseKey(k);
                    const el = cellEl(r, c);
                    el.classList.add("visited");
                }
                visitedCnt.textContent = String(i);

                animTimer = setTimeout(visitStep, delay);
                return;
            }

            // path phase
            const drawPath = () => {
                if (!found) {
                    showToast("未找到路径（可能被墙围住了）");
                    running = false;
                    btnRun.disabled = false;
                    return;
                }

                let j = 0;
                const totalCost = costSoFar.get(endK) ?? 0;
                pathLen.textContent = String(Math.max(0, path.length - 1));
                pathCost.textContent = (Math.round(totalCost * 100) / 100).toString();

                const pathStep = () => {
                    if (!running) return;
                    if (j >= path.length) {
                        running = false;
                        btnRun.disabled = false;
                        showToast("完成 ✓");
                        return;
                    }
                    const k = path[j++];
                    if (k !== startK && k !== endK) {
                        const { r, c } = parseKey(k);
                        cellEl(r, c).classList.add("path");
                    }
                    animTimer = setTimeout(pathStep, Math.max(8, delay));
                };
                pathStep();
            };

            drawPath();
        };

        visitStep();
    }

    // --- Input handling ---
    function getRCFromEvent(e) {
        const target = e.target.closest(".cell");
        if (!target) return null;
        const r = Number(target.dataset.r);
        const c = Number(target.dataset.c);
        return { r, c };
    }

    function onDown(e) {
        if (running) return;
        pointerDown = true;

        const rc = getRCFromEvent(e);
        if (!rc) return;

        const { r, c } = rc;

        if (tool === "move") {
            if (isStart(r, c)) dragNode = "start";
            else if (isEnd(r, c)) dragNode = "end";
            else dragNode = null;
            return;
        }

        if (isStart(r, c) || isEnd(r, c)) return;
        applyToolAt(r, c);
    }

    function onMove(e) {
        if (running) return;
        if (!pointerDown) return;

        const rc = getRCFromEvent(e);
        if (!rc) return;
        const { r, c } = rc;

        if (tool === "move") {
            if (!dragNode) return;
            if (grid[r][c] === TYPE.WALL) return;

            // don't overlap
            if (dragNode === "start" && isEnd(r, c)) return;
            if (dragNode === "end" && isStart(r, c)) return;

            const prev = dragNode === "start" ? { ...start } : { ...end };

            if (dragNode === "start") start = { r, c };
            else end = { r, c };

            renderCell(prev.r, prev.c);
            renderCell(r, c);
            return;
        }

        if (isStart(r, c) || isEnd(r, c)) return;
        applyToolAt(r, c);
    }

    function onUp() {
        pointerDown = false;
        dragNode = null;
    }

    // --- Controls ---
    toolBtns.forEach(btn => {
        btn.addEventListener("click", () => setTool(btn.dataset.tool));
    });

    speed.addEventListener("input", () => {
        speedText.textContent = String(speed.value);
    });

    btnRun.addEventListener("click", runSearch);
    btnClearPath.addEventListener("click", () => {
        stopAnim();
        running = false;
        btnRun.disabled = false;
        clearPathVisual();
        resetStats();
        showToast("已清除路径");
    });
    btnClearAll.addEventListener("click", clearAll);
    btnRandom.addEventListener("click", () => {
        generateRandomMap({
            wallDensity: 0.22,
            weightDensity: 0.10
        });
    });
    // Keyboard shortcuts
    window.addEventListener("keydown", (e) => {
        if (e.repeat) return;
        const k = e.key.toLowerCase();

        if (k === "r") runSearch();
        if (k === "c") btnClearPath.click();
        if (k === "x") btnClearAll.click();
        if (k === "g") generateRandomMap(); // NEW: G = Generate random map
        if (k === "w") setTool("wall");
        if (k === "e") setTool("erase");
        if (k === "q") setTool("weight");
        if (k === "m") setTool("move");
    });

    // Pointer events
    boardEl.addEventListener("pointerdown", (e) => { boardEl.setPointerCapture?.(e.pointerId); onDown(e); });
    boardEl.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // Init
    function init() {
        buildBoardDOM();
        resetStats();
        speedText.textContent = String(speed.value);
        setTool("wall");
        clearToast();
        showToast("开始：画墙或拖拽起点/终点");
    }

    init();
})();
