/* Phone prototype — all made up, on purpose.
   Nothing is stored, nothing is sent, no location is read. */

(function () {
  "use strict";

  var body = document.body;
  var inside = document.getElementById("inside");
  var hint = document.getElementById("hint");

  /* ---------- The cover: a working row counter ---------- */
  var n = 0;
  var countBtn = document.getElementById("count");

  function draw() { countBtn.textContent = n; }
  document.getElementById("plus").onclick = function () { n++; draw(); };
  document.getElementById("minus").onclick = function () { if (n > 0) n--; draw(); };
  document.getElementById("reset").onclick = function () { n = 0; draw(); };
  draw();

  /* ---------- The way in: press and hold the number ---------- */
  var HOLD = 1200;
  var timer = null;

  function holdStart(e) {
    if (e.type === "mousedown" && e.button !== 0) return;
    countBtn.classList.add("holding");
    clearTimeout(timer);
    timer = setTimeout(openInside, HOLD);
  }
  function holdEnd() {
    countBtn.classList.remove("holding");
    clearTimeout(timer);
  }
  countBtn.addEventListener("pointerdown", holdStart);
  countBtn.addEventListener("pointerup", holdEnd);
  countBtn.addEventListener("pointerleave", holdEnd);
  countBtn.addEventListener("pointercancel", holdEnd);
  countBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  /* ---------- Cover and uncover ---------- */
  function openInside() {
    holdEnd();
    inside.hidden = false;
    void inside.offsetWidth;
    body.setAttribute("data-view", "inside");
    startClock();
    if (hint) hint.hidden = true;
  }
  function coverUp() {
    body.setAttribute("data-view", "cover");
    stopClock();
    setTimeout(function () { if (body.getAttribute("data-view") === "cover") inside.hidden = true; }, 300);
  }
  document.getElementById("to-cover").onclick = coverUp;

  // Locking the screen or switching to another app covers it at once.
  // (Only visibilitychange: on a computer, window blur fires when you merely
  // click outside the window, which covers the app in the middle of a demo.)
  document.addEventListener("visibilitychange", function () { if (document.hidden) coverUp(); });
  // Esc on a computer, for testing
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") coverUp(); });

  /* ---------- Sightings, and how they die ----------
     A sighting lives for LIFE minutes and then disappears. It fades the whole
     way, because information about a street stops being true long before it
     stops being on the screen.
     In this demonstration the clock runs fast, so that the fading can be seen:
     one minute passes every TICK milliseconds. */
  var LIFE = 40;
  var TICK = 2000;
  var clock = null;

  var list = document.getElementById("sightings");
  var map = document.getElementById("map");
  var empty = document.getElementById("empty");

  var PLACES = ["Enghelab St · near the metro", "Valiasr Sq · west side", "Park entrance", "Bus stop, north side", "Near the bakery"];

  function makeDemo() {
    return [
      { where: PLACES[0], age: 4,  reports: 3, x: 38, y: 30 },
      { where: PLACES[1], age: 11, reports: 2, x: 70, y: 58 },
      { where: PLACES[2], age: 26, reports: 1, x: 22, y: 74 },
      { where: PLACES[3], age: 37, reports: 1, x: 58, y: 16 }
    ];
  }
  var sightings = makeDemo();

  function render() {
    list.replaceChildren();
    map.querySelectorAll(".dot").forEach(function (d) { d.remove(); });

    sightings.forEach(function (s) {
      var left = 1 - s.age / LIFE;            // 1 = just reported, 0 = gone
      var fade = 0.2 + 0.8 * left;

      var li = document.createElement("li");
      li.style.opacity = fade;

      var main = document.createElement("span");
      main.textContent = s.where;
      var sure = document.createElement("span");
      sure.className = "sure";
      sure.textContent = s.reports + (s.reports === 1 ? " report" : " reports");
      main.appendChild(sure);

      var right = document.createElement("span");
      right.className = "when";
      right.textContent = s.age + " min ago";
      var life = document.createElement("span");
      life.className = "life";
      life.style.setProperty("--left", (left * 100) + "%");
      life.title = Math.max(0, LIFE - s.age) + " minutes before it is dropped";
      right.appendChild(life);

      li.append(main, right);
      list.appendChild(li);

      var dot = document.createElement("span");
      dot.className = "dot" + (left < 0.5 ? " faint" : "");
      dot.style.left = s.x + "%";
      dot.style.top = s.y + "%";
      dot.style.opacity = fade;
      dot.setAttribute("aria-hidden", "true");
      map.appendChild(dot);
    });

    empty.hidden = sightings.length > 0;
  }

  function tick() {
    sightings.forEach(function (s) { s.age++; });
    sightings = sightings.filter(function (s) { return s.age < LIFE; });
    render();
  }
  function startClock() {
    render();
    clearInterval(clock);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) clock = setInterval(tick, TICK);
  }
  function stopClock() { clearInterval(clock); }

  /* ---------- Report: it adds a fresh sighting here, and goes nowhere ---------- */
  var report = document.getElementById("report");
  report.onclick = function () {
    sightings.unshift({
      where: PLACES[Math.floor(Math.random() * PLACES.length)],
      age: 0,
      reports: 1,
      x: 20 + Math.round(Math.random() * 60),
      y: 20 + Math.round(Math.random() * 60)
    });
    render();
    report.dataset.done = "1";
    report.textContent = "Added here · nothing was sent";
    setTimeout(function () {
      report.dataset.done = "";
      report.textContent = "Report a sighting here";
    }, 2600);
  };

  /* ---------- "I am stopped" ----------
     Hold the button for 2 seconds. Then the app covers itself at once:
     when you are stopped, this must not be the thing on your screen. */
  var sheet = document.getElementById("sheet-stop");
  var holdBtn = document.getElementById("hold");
  var holdLabel = holdBtn.querySelector(".hold-label");
  var holdTimer = null;

  function openStop() {
    sheet.hidden = false;
    void sheet.offsetWidth;
    body.setAttribute("data-view", "stop");
  }
  function closeStop() {
    body.setAttribute("data-view", "inside");
    resetHold();
    setTimeout(function () { if (body.getAttribute("data-view") !== "stop") sheet.hidden = true; }, 320);
  }
  function resetHold() {
    clearTimeout(holdTimer);
    holdBtn.classList.remove("holding");
    holdBtn.dataset.sent = "";
    holdLabel.textContent = "Hold to tell them";
  }

  document.getElementById("stop-open").onclick = openStop;
  document.getElementById("stop-cancel").onclick = closeStop;

  holdBtn.addEventListener("pointerdown", function (e) {
    if (e.type === "mousedown" && e.button !== 0) return;
    if (holdBtn.dataset.sent === "1") return;
    holdBtn.classList.add("holding");
    clearTimeout(holdTimer);
    holdTimer = setTimeout(sent, 2000);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
    holdBtn.addEventListener(ev, function () {
      if (holdBtn.dataset.sent === "1") return;
      resetHold();
    });
  });
  holdBtn.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function sent() {
    holdBtn.classList.remove("holding");
    holdBtn.dataset.sent = "1";
    var t = new Date();
    var hh = String(t.getHours()).padStart(2, "0");
    var mm = String(t.getMinutes()).padStart(2, "0");
    holdLabel.textContent = "Nothing was sent · " + hh + ":" + mm;
    // The app hides itself, because the next thing that happens is the phone being looked at.
    setTimeout(function () { closeStop(); coverUp(); }, 1600);
  }
})();
