const $ = (id) => document.getElementById(id);
const statusEl = $("status");

// Header controls
const monthTitleEl = $("monthTitle");
const prevMonthBtn = $("prevMonth");
const nextMonthBtn = $("nextMonth");
const todayBtn = $("todayBtn");

// Tabs
const tabButtons = Array.from(document.querySelectorAll(".tab"));
const panels = Array.from(document.querySelectorAll(".panel"));

// Calendar
const monthGridEl = $("monthGrid");
const monthNotesEl = $("monthNotes");

// Other tabs textareas
const doAsapEl = $("doAsap");
const doEventuallyEl = $("doEventually");
const buyNowEl = $("buyNow");
const buyEventuallyEl = $("buyEventually");
const schoolEl = $("school");
const workEl = $("work");

// ---------- Date helpers ----------
function pad2(n){ return String(n).padStart(2,"0"); }

function toISODate(d){
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function monthKey(d){ // YYYY-MM
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
}

function startOfMonth(d){
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d){
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
}

// Monday-start week index: Mon=0 ... Sun=6
function mondayIndex(jsDay){ // jsDay: Sun=0..Sat=6
  return (jsDay + 6) % 7;
}

// ---------- Storage keys ----------
const KEY_GLOBAL = "planner:v2:global";
const KEY_MONTH_PREFIX = "planner:v2:month:"; // + YYYY-MM
const KEY_DAY_PREFIX = "planner:v2:day:";     // + YYYY-MM-DD

function saveStatus(){
  if (!statusEl) return;
  statusEl.textContent = `Saved: ${new Date().toLocaleTimeString()}`;
}

// ---------- Global data (tabs) ----------
function loadGlobal(){
  const raw = localStorage.getItem(KEY_GLOBAL);
  const data = raw ? JSON.parse(raw) : {
    doAsap: "",
    doEventually: "",
    buyNow: "",
    buyEventually: "",
    school: "",
    work: ""
  };

  if (doAsapEl) doAsapEl.value = data.doAsap ?? "";
  if (doEventuallyEl) doEventuallyEl.value = data.doEventually ?? "";
  if (buyNowEl) buyNowEl.value = data.buyNow ?? "";
  if (buyEventuallyEl) buyEventuallyEl.value = data.buyEventually ?? "";
  if (schoolEl) schoolEl.value = data.school ?? "";
  if (workEl) workEl.value = data.work ?? "";
}

function saveGlobal(){
  const data = {
    doAsap: doAsapEl ? doAsapEl.value : "",
    doEventually: doEventuallyEl ? doEventuallyEl.value : "",
    buyNow: buyNowEl ? buyNowEl.value : "",
    buyEventually: buyEventuallyEl ? buyEventuallyEl.value : "",
    school: schoolEl ? schoolEl.value : "",
    work: workEl ? workEl.value : ""
  };
  localStorage.setItem(KEY_GLOBAL, JSON.stringify(data));
  saveStatus();
}

function wireAutosave(el, fn){
  if (!el) return;
  el.addEventListener("input", () => {
    window.clearTimeout(wireAutosave.t);
    wireAutosave.t = window.setTimeout(fn, 250);
  });
}

// ---------- Month notes ----------
function loadMonthNotes(activeMonthDate){
  if (!monthNotesEl) return;
  const k = KEY_MONTH_PREFIX + monthKey(activeMonthDate);
  const raw = localStorage.getItem(k);
  monthNotesEl.value = raw ?? "";
}

function saveMonthNotes(activeMonthDate){
  if (!monthNotesEl) return;
  const k = KEY_MONTH_PREFIX + monthKey(activeMonthDate);
  localStorage.setItem(k, monthNotesEl.value);
  saveStatus();
}

// ---------- Day notes ----------
function loadDayNote(iso){
  const raw = localStorage.getItem(KEY_DAY_PREFIX + iso);
  return raw ?? "";
}

function saveDayNote(iso, text){
  localStorage.setItem(KEY_DAY_PREFIX + iso, text);
  saveStatus();
}

// ---------- Calendar rendering ----------
let activeMonth = new Date(); // today
activeMonth.setHours(0,0,0,0);
activeMonth = startOfMonth(activeMonth);

function renderMonth(){
  if (!monthTitleEl || !monthGridEl) return;

  const label = activeMonth.toLocaleString(undefined, { month:"long", year:"numeric" });
  monthTitleEl.textContent = label;

  loadMonthNotes(activeMonth);

  // Build a 6-week grid (42 cells) Monday-start
  monthGridEl.innerHTML = "";

  const first = startOfMonth(activeMonth);
  const startOffset = mondayIndex(first.getDay()); // 0..6

  // Grid starts at "first day of month minus offset"
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  for(let i=0; i<42; i++){
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);

    const iso = toISODate(cellDate);
    const inMonth = (cellDate.getMonth() === activeMonth.getMonth());

    const cell = document.createElement("div");
    cell.className = "dayCell" + (inMonth ? "" : " outside");

    const top = document.createElement("div");
    top.className = "dayTop";

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = cellDate.getDate();

    const badge = document.createElement("div");
    badge.className = "badge";
    const todayISO = toISODate(new Date());
    badge.textContent = (iso === todayISO) ? "Today" : "";
    if(!badge.textContent) badge.style.visibility = "hidden";

    top.appendChild(num);
    top.appendChild(badge);

    const notes = document.createElement("textarea");
    notes.className = "dayNotes";
    notes.placeholder = "Notes / tasks…";
    notes.value = loadDayNote(iso);

    // Save on input (debounced per cell)
    let t;
    notes.addEventListener("input", () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => saveDayNote(iso, notes.value), 200);
    });

    cell.appendChild(top);
    cell.appendChild(notes);
    monthGridEl.appendChild(cell);
  }
}

function goToday(){
  const d = new Date();
  d.setHours(0,0,0,0);
  activeMonth = startOfMonth(d);
  renderMonth();
}

// ---------- Tabs ----------
function setActiveTab(name){
  tabButtons.forEach(btn => {
    const is = btn.dataset.tab === name;
    btn.classList.toggle("active", is);
    btn.setAttribute("aria-selected", is ? "true" : "false");
  });

  panels.forEach(p => p.classList.toggle("active", p.id === `tab-${name}`));
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab));
});

// ---------- Wire up controls ----------
if (prevMonthBtn) prevMonthBtn.addEventListener("click", () => {
  activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth()-1, 1);
  renderMonth();
});

if (nextMonthBtn) nextMonthBtn.addEventListener("click", () => {
  activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth()+1, 1);
  renderMonth();
});

if (todayBtn) todayBtn.addEventListener("click", goToday);

// Autosave (global tabs)
[
  doAsapEl, doEventuallyEl, buyNowEl, buyEventuallyEl, schoolEl, workEl
].forEach(el => wireAutosave(el, saveGlobal));

// Month notes autosave
wireAutosave(monthNotesEl, () => saveMonthNotes(activeMonth));

// ---------- Init ----------
loadGlobal();
renderMonth();
setActiveTab("calendar");
