// ---- Build pages (right pages get the hint) ----
function buildPageHTML(isRightPage) {
  const hint = isRightPage ? `<span class="corner-hint right" aria-hidden="true"></span>` : ``;
  return `
    <div class="page">
      <div class="ruled"></div>
      ${hint}
    </div>`;
}

function makePages(count) {
  const $book = $("#flipbook");
  for (let i = 1; i <= count; i++) {
    const isRight = i === 1 || i % 2 === 1; // 1,3,5,... are right pages
    $book.append(buildPageHTML(isRight));
  }
}

// ---- Responsive sizing (no transform scaling) ----
function resizeBook() {
  const cs = getComputedStyle(document.documentElement);
  const BASE_W = parseFloat(cs.getPropertyValue("--base-page-w")); // 560
  const BASE_H = parseFloat(cs.getPropertyValue("--base-page-h")); // 794
  const baseBookW = BASE_W * 2;
  const baseBookH = BASE_H;

  const padding = 32;
  const availW = Math.max(320, window.innerWidth - padding * 2);
  const availH = Math.max(320, window.innerHeight - 140);
  const scale  = Math.min(availW / baseBookW, availH / baseBookH, 1);

  const pageW = Math.round(BASE_W * scale);
  const pageH = Math.round(BASE_H * scale);
  const bookW = pageW * 2;
  const bookH = pageH;

  const r = document.documentElement.style;
  r.setProperty("--page-w", pageW + "px");
  r.setProperty("--page-h", pageH + "px");
  r.setProperty("--book-w", bookW + "px");
  r.setProperty("--book-h", bookH + "px");

  if ($("#flipbook").data("turn")) {
    $("#flipbook").turn("size", bookW, bookH);
    showHintsSoon(); // <- ensure hint reappears after resize
  }
}

// ---- Hint control (right page only) ----
let hintTimer = null;
function showHintsSoon(delay = 120) {
  clearTimeout(hintTimer);
  hintTimer = setTimeout(updateHints, delay);
}

function updateHints() {
  const $book = $("#flipbook");
  if (!$book.data("turn")) return;

  const total = $book.turn("pages");
  const page  = $book.turn("page");
  const view  = $book.turn("view"); // [left,right]

  // Hide all first
  $(".corner-hint").addClass("hint-hidden").removeClass("hint-paused");

  // Only show right hint when forward is possible
  const right = view[1];
  if (right && page < total) {
    $book.find(".page").eq(right - 1)
      .find(".corner-hint.right")
      .removeClass("hint-hidden");
  }
}

// Pause animation when pointer is near the corner (feels more “attached”)
function wireHintHover() {
  $("#flipbook").on("mousemove", ".page", function (e) {
    const $p   = $(this);
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const near = 56;

    const isRightPage = ($p.index() + 1) % 2 === 1;
    if (!isRightPage) return;

    const nearRight = x > rect.width - near && y > rect.height - near;
    $p.find(".corner-hint.right").toggleClass("hint-paused", nearRight);
  });

  $("#flipbook").on("mouseleave", ".page", function () {
    $(this).find(".corner-hint").removeClass("hint-paused");
  });
}

// ---- Init Turn.js ----
function initFlipbook() {
  const bookW = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--book-w"));
  const bookH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--book-h"));

  $("#flipbook").turn({
    width: bookW,
    height: bookH,
    display: "double",
    autoCenter: true,
    gradients: true,
    elevation: 50,
    turnCorners: "br", // only bottom-right is interactive
    when: {
      // Hide only during active flip
      start()   { $(".corner-hint").addClass("hint-hidden"); },
      turning() { $(".corner-hint").addClass("hint-hidden"); },
      // After flip completes, re-evaluate and show the correct hint
      turned()  { showHintsSoon(0); },
      end()     { showHintsSoon(0); }
    }
  });

  // Controls & keyboard
  document.getElementById("prev").addEventListener("click", () => $("#flipbook").turn("previous"));
  document.getElementById("next").addEventListener("click", () => $("#flipbook").turn("next"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  $("#flipbook").turn("previous");
    if (e.key === "ArrowRight") $("#flipbook").turn("next");
  });

  wireHintHover();
  showHintsSoon(0); // initial reveal after init
}

// ---- Boot ----
window.addEventListener("load", () => {
  if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.turn) {
    alert("Turn.js failed to load. Check internet or script URLs.");
    return;
  }
  makePages(10);
  resizeBook();
  initFlipbook();
});

window.addEventListener("resize", resizeBook);

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>A5 Dot-Grid Flipbook (smart corner nudge)</title>

  <link rel="stylesheet" href="styles.css" />

  <!-- jQuery (required by Turn.js) -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js" crossorigin="anonymous"></script>
  <!-- Turn.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js" crossorigin="anonymous"></script>
</head>
<body>
  <div class="wrap">
    <div id="flipbook"><!-- pages injected by app.js --></div>

    <div class="controls">
      <button id="prev" class="btn">⟵ Prev</button>
      <span class="hint">Tip: click/tap a bottom corner or use ← →</span>
      <button id="next" class="btn">Next ⟶</button>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>

:root{
  /* A5 base size at ~96dpi */
  --base-page-w: 560;
  --base-page-h: 794;

  /* Effective sizes (JS updates these) */
  --page-w: 560px;
  --page-h: 794px;
  --book-w: 1120px; /* 2 * page */
  --book-h: 794px;

  --paper: #ffffff;
  --line:  #e5eaf5; /* dot color */
}

html, body { height: 100%; }
body {
  margin: 0;
  background: radial-gradient(1200px 800px at 50% 20%, #eef2f8, #e7ecf6 35%, #eaf0ff 60%, #eef3ff 100%) fixed;
  font-family: system-ui, -apple-system, "Segoe UI", Inter, Roboto, Arial, sans-serif;
}

.wrap {
  min-height: 100%;
  display: grid;
  place-items: center;
  padding: 24px;
}

/* No transform scaling: we resize real pixels so Turn.js geometry stays correct */
#flipbook {
  width: var(--book-w);
  height: var(--book-h);
  filter: drop-shadow(0 12px 30px rgba(10, 20, 60, 0.15));
}

/* Pages */
.page {
  width: var(--page-w);
  height: var(--page-h);
  background: white;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  box-shadow: none; /* remove local shadow to avoid gradient spill */
}

/* Add outer shadow via flipbook wrapper */
#flipbook {
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));
}


.page::before {
  /* soft paper sheen */
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,.95), rgba(247,250,255,.9));
  pointer-events: none;
}

/* Dot grid — edge to edge */
.ruled {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--line) 1px, transparent 1px);
  background-size: 24px 24px; /* spacing between dots */
}

/* Corner hints (live inside the page so they move with page curl) */
.corner-hint {
  position: absolute;
  bottom: 0;
  width: 42px;
  height: 42px;
  pointer-events: none;      /* never block flipping */
  overflow: visible;
  z-index: 3;
  opacity: 1;
  transition: opacity .18s ease; /* smooth show/hide while flipping */
}

/* Right corner (default) */
.corner-hint.right { right: 0; }
.corner-hint.right::before {
  content: "";
  position: absolute; right: 0; bottom: 0;
  width: 100%; height: 100%;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  background:
    linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0) 60%),
    linear-gradient(135deg, #ffffff, #f2f6ff);
  box-shadow: -3px -3px 6px rgba(0,0,0,0.08);
  transform-origin: 100% 100%;
  animation: curl-peek-right 6.5s ease-in-out infinite;
}
.corner-hint.right::after {
  content: "➜";
  position: absolute; right: 6px; bottom: 6px;
  font-size: 12px; line-height: 1;
  color: rgba(0,0,0,0.28);
  transform: rotate(315deg);
  animation: nudge-right 6.5s ease-in-out infinite;
}

/* Left corner */
.corner-hint.left { left: 0; }
.corner-hint.left::before {
  content: "";
  position: absolute; left: 0; bottom: 0;
  width: 100%; height: 100%;
  clip-path: polygon(0 0, 0 100%, 100% 100%);
  background:
    linear-gradient(225deg, rgba(0,0,0,0.08), rgba(0,0,0,0) 60%),
    linear-gradient(225deg, #ffffff, #f2f6ff);
  box-shadow: 3px -3px 6px rgba(0,0,0,0.08);
  transform-origin: 0% 100%;
  animation: curl-peek-left 6.5s ease-in-out infinite;
}
.corner-hint.left::after {
  content: "➜";
  position: absolute; left: 6px; bottom: 6px;
  font-size: 12px; line-height: 1;
  color: rgba(0,0,0,0.28);
  transform: rotate(225deg);
  animation: nudge-left 6.5s ease-in-out infinite;
}

/* Pause/hide helpers controlled by JS */
.corner-hint.hint-hidden { opacity: 0; }
.corner-hint.hint-paused::before,
.corner-hint.hint-paused::after { animation-play-state: paused; }

/* Animations */
@keyframes curl-peek-right {
  0%,5%   { transform: rotate(0deg) translate(0,0); opacity:.85; }
  6%      { transform: rotate(-6deg) translate(-2px,-2px); opacity:1; }
  10%     { transform: rotate(-10deg) translate(-6px,-6px); opacity:1; }
  14%     { transform: rotate(-6deg) translate(-2px,-2px); opacity:1; }
  15%,100%{ transform: rotate(0deg) translate(0,0); opacity:.85; }
}
@keyframes nudge-right {
  0%,5%   { transform: translate(0,0) rotate(315deg); opacity:.35; }
  6%      { transform: translate(-1px,-1px) rotate(315deg); opacity:.45; }
  10%     { transform: translate(-3px,-3px) rotate(315deg); opacity:.55; }
  14%     { transform: translate(-1px,-1px) rotate(315deg); opacity:.45; }
  15%,100%{ transform: translate(0,0) rotate(315deg); opacity:.35; }
}
@keyframes curl-peek-left {
  0%,5%   { transform: rotate(0deg) translate(0,0); opacity:.85; }
  6%      { transform: rotate(6deg) translate(2px,-2px); opacity:1; }
  10%     { transform: rotate(10deg) translate(6px,-6px); opacity:1; }
  14%     { transform: rotate(6deg) translate(2px,-2px); opacity:1; }
  15%,100%{ transform: rotate(0deg) translate(0,0); opacity:.85; }
}
@keyframes nudge-left {
  0%,5%   { transform: translate(0,0) rotate(225deg); opacity:.35; }
  6%      { transform: translate(1px,-1px) rotate(225deg); opacity:.45; }
  10%     { transform: translate(3px,-3px) rotate(225deg); opacity:.55; }
  14%     { transform: translate(1px,-1px) rotate(225deg); opacity:.45; }
  15%,100%{ transform: translate(0,0) rotate(225deg); opacity:.35; }
}

/* Controls */
.controls {
  margin-top: 14px;
  display: flex; gap: 8px;
  justify-content: center; align-items: center;
  color: #415173; font-size: 14px;
}
.btn {
  border: 1px solid #d5dbea; background: #fff; padding: 8px 12px;
  border-radius: 10px; cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease, background .12s ease;
}
.btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(40,60,120,.12); background: #f9fbff; }
.hint { opacity: .85; }

/* Print */
@media print {
  @page { size: A5 portrait; margin: 12mm; }
  body { background: #fff; }
  #flipbook { width: var(--page-w); height: var(--page-h); filter: none; }
  .page { break-after: page; border: 0; }
  .controls, .corner-hint { display: none; }
}
