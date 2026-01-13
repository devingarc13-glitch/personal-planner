// app.js
const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const monthTitleEl = $("monthTitle");
const monthGridEl = $("monthGrid");
const monthNotesEl = $("monthNotes");

let activeMonth = new Date();
activeMonth.setHours(0, 0, 0, 0);
activeMonth.setDate(1);

let calendarType = "personal"; // personal | work | school

// -------- helpers --------
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// storage keys
const kDay = (date) => `planner:${calendarType}:day:${iso(date)}`;
const kMonth = () => `planner:${calendarType}:month:${monthKey(activeMonth)}`;
const kGlobal = (id) => `planner:global:${id}`;

function saveStatus() {
  if (!statusEl) return;
  statusEl.textContent = `Saved: ${new Date().toLocaleTimeString()}`;
}

// Auto-grow textarea (no scrolling)
function autoGrow(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}

// Debounced save helper
function wireAutosave(el, fn, delay = 200) {
  if (!el) return;
  let t;
  el.addEventListener("input", () => {
    autoGrow(el);
    window.clearTimeout(t);
    t = window.setTimeout(fn, delay);
  });
}

// -------- Tabs (Calendar/Notes/To-Do/Buy) --------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

    const panel = $(`tab-${btn.dataset.tab}`);
    if (panel) panel.classList.add("active");
  });
});

// -------- Calendar Type (Personal/Work/School) --------
document.querySelectorAll(".subtab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    calendarType = btn.dataset.cal;
    render();
  });
});

// -------- Render Calendar --------
function render() {
  // header title
  monthTitleEl.textContent = activeMonth.toLocaleString(undefined, { month: "long", year: "numeric" });

  // month notes (per calendarType + month)
  monthNotesEl.value = localStorage.getItem(kMonth()) || "";
  autoGrow(monthNotesEl);

  // grid
  monthGridEl.innerHTML = "";

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday-start offset

  // blank spacers before day 1 (still keeps month big, no outside-month days)
  for (let i = 0; i < offset; i++) {
    const spacer = document.createElement("div");
    monthGridEl.appendChild(spacer);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = iso(today);

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);
    const dateISO = iso(date);

    const cell = document.createElement("div");
    cell.className = "dayCell" + (dateISO === todayISO ? " today" : "");

    const top = document.createElement("div");
    top.className = "dayTop";

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = d;

    const badge = document.createElement("div");
    badge.className = "badge";
    if (dateISO === todayISO) {
      badge.textContent = "Today";
    } else {
      badge.textContent = "";
      badge.style.visibility = "hidden";
    }

    top.append(num, badge);

    const notes = document.createElement("textarea");
    notes.className = "dayNotes";
    notes.placeholder = "Notes / tasks…";
    notes.value = localStorage.getItem(kDay(date)) || "";
    autoGrow(notes);

    wireAutosave(notes, () => {
      localStorage.setItem(kDay(date), notes.value);
      saveStatus();
    });

    cell.append(top, notes);
    monthGridEl.appendChild(cell);
  }
}

// -------- Nav buttons --------
$("prevMonth").addEventListener("click", () => {
  activeMonth.setMonth(activeMonth.getMonth() - 1);
  activeMonth.setDate(1);
  render();
});

$("nextMonth").addEventListener("click", () => {
  activeMonth.setMonth(activeMonth.getMonth() + 1);
  activeMonth.setDate(1);
  render();
});

$("todayBtn").addEventListener("click", () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  render();
  // after render, today cell is highlighted automatically
});

// -------- Month notes save --------
wireAutosave(monthNotesEl, () => {
  localStorage.setItem(kMonth(), monthNotesEl.value);
  saveStatus();
});

// -------- Global textareas (Notes/To-Do/Buy) --------
function initGlobal(id) {
  const el = $(id);
  if (!el) return;
  el.value = localStorage.getItem(kGlobal(id)) || "";
  autoGrow(el);
  wireAutosave(el, () => {
    localStorage.setItem(kGlobal(id), el.value);
    saveStatus();
  });
}

initGlobal("notesGlobal");
initGlobal("todoText");
initGlobal("buyText");

// -------- Init --------
render();
saveStatus();
