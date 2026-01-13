const $ = (id) => document.getElementById(id);

// ---------- STATE ----------
let activeMonth = new Date();
activeMonth.setHours(0, 0, 0, 0);
activeMonth.setDate(1);

let calendarType = "personal"; // personal | work | school

// ---------- HELPERS ----------
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ---------- STORAGE KEYS ----------
const kDay = (date) => `planner:${calendarType}:day:${iso(date)}`;
const kMonth = () => `planner:${calendarType}:month:${monthKey(activeMonth)}`;

// ---------- TABS (Calendar / Notes / To-Do / Buy) ----------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const panel = $(`tab-${btn.dataset.tab}`);
    if (panel) panel.classList.add("active");
  };
});

// ---------- CALENDAR TYPE (Personal / Work / School) ----------
document.querySelectorAll(".subtab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    calendarType = btn.dataset.cal; // personal/work/school
    render();
  };
});

// ---------- CALENDAR RENDER ----------
function render() {
  $("monthTitle").textContent = activeMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const grid = $("monthGrid");
  grid.innerHTML = "";

  // month notes for this calendarType + month
  const monthNotesEl = $("monthNotes");
  monthNotesEl.value = localStorage.getItem(kMonth()) || "";

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7; // Monday-start offset

  // blank cells before day 1
  for (let i = 0; i < offset; i++) {
    const spacer = document.createElement("div");
    grid.appendChild(spacer);
  }

  // real days only (no outside-month days)
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);

    const cell = document.createElement("div");
    cell.className = "dayCell";

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = d;

    const notes = document.createElement("textarea");
    notes.className = "dayNotes";
    notes.value = localStorage.getItem(kDay(date)) || "";

    notes.oninput = () => {
      localStorage.setItem(kDay(date), notes.value);
    };

    cell.append(num, notes);
    grid.appendChild(cell);
  }
}

// ---------- NAV BUTTONS ----------
$("prevMonth").onclick = () => {
  activeMonth.setMonth(activeMonth.getMonth() - 1);
  activeMonth.setDate(1);
  render();
};

$("nextMonth").onclick = () => {
  activeMonth.setMonth(activeMonth.getMonth() + 1);
  activeMonth.setDate(1);
  render();
};

$("todayBtn").onclick = () => {
  activeMonth = new Date();
  activeMonth.setHours(0, 0, 0, 0);
  activeMonth.setDate(1);
  render();
};

// ---------- MONTH NOTES ----------
$("monthNotes").oninput = () => {
  localStorage.setItem(kMonth(), $("monthNotes").value);
};

// ---------- GLOBAL TEXTAREAS (Notes / To-Do / Buy) ----------
function wireGlobal(id) {
  const el = $(id);
  if (!el) return;
  el.value = localStorage.getItem(`planner:global:${id}`) || "";
  el.oninput = () => localStorage.setItem(`planner:global:${id}`, el.value);
}

// These MUST match your HTML IDs:
wireGlobal("notes-personal"); // Notes tab textarea
wireGlobal("doAsap");         // To-Do tab textarea
wireGlobal("buyNow");         // Buy tab textarea

// ---------- INIT ----------
render();
