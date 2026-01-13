const $ = (id) => document.getElementById(id);
const statusEl = $("status");

// ---------- STATE ----------
let activeMonth = new Date();
activeMonth.setHours(0, 0, 0, 0);
activeMonth.setDate(1);

let calendarType = "personal"; // personal | work | school

// ---------- HELPERS ----------
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const todayISO = () => iso(new Date());

// ---------- STORAGE KEYS ----------
const kDay = (date) => `planner:${calendarType}:day:${iso(date)}`;
const kMonth = () => `planner:${calendarType}:month:${monthKey(activeMonth)}`;
const kGlobal = (id) => `planner:global:${id}`;

function saveStatus(){
  if (!statusEl) return;
  statusEl.textContent = `Saved: ${new Date().toLocaleTimeString()}`;
}

// Auto-grow textarea (no inner scroll)
function autoGrow(ta){
  ta.style.height = "auto";
  ta.style.height = (ta.scrollHeight) + "px";
}

// ---------- TOP TABS ----------
document.querySelectorAll(".tab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");

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
function render(scrollToToday = false) {
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

  const tISO = todayISO();
  let todayCell = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);
    const thisISO = iso(date);

    const cell = document.createElement("div");
    cell.className = "dayCell";
    cell.dataset.iso = thisISO;

    if (thisISO === tISO) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = d;

    const notes = document.createElement("textarea");
    notes.className = "dayNotes";
    notes.placeholder = "Notes / tasks…";
    notes.value = localStorage.getItem(kDay(date)) || "";

    // grow initially + on input
    autoGrow(notes);
    notes.addEventListener("input", () => {
      localStorage.setItem(kDay(date), notes.value);
      autoGrow(notes);
      saveStatus();
    });

    cell.append(num, notes);
    grid.appendChild(cell);

    if (thisISO === tISO) todayCell = cell;
  }

  // after render, scroll to today's cell if requested
  if (scrollToToday && todayCell) {
    todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
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
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  render(true); // highlight + scroll to today
};

// ---------- MONTH NOTES ----------
$("monthNotes").addEventListener("input", () => {
  localStorage.setItem(kMonth(), $("monthNotes").value);
  saveStatus();
});

// ---------- GLOBAL TEXTAREAS (Notes / To-Do / Buy) ----------
function wireGlobal(id) {
  const el = $(id);
  if (!el) return;

  el.value = localStorage.getItem(kGlobal(id)) || "";
  el.addEventListener("input", () => {
    localStorage.setItem(kGlobal(id), el.value);
    saveStatus();
  });
}

wireGlobal("notesGlobal");
wireGlobal("doAsap");
wireGlobal("doEventually");
wireGlobal("buyNow");
wireGlobal("buyEventually");

// ---------- INIT ----------
render();
