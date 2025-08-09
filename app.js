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
