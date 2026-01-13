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

  doAsapEl.value = data.doAsap ?? "";
  doEventuallyEl.value = data.doEventually ?? "";
  buyNowEl.value = data.buyNow ?? "";
  buyEventuallyEl.value = data.buyEventually ?? "";
  schoolEl.value = data.school ?? "";
  workEl.value = data.work ?? "";
}

function saveGlobal(){
  const data = {
    doAsap: doAsapEl.value,
    doEventually: doEventuallyEl.value,
    buyNow: buyNowEl.value,
    buyEventually: buyEventuallyEl.value,
    school: schoolEl.value,
    work: workEl.value
  };
  localStorage.setItem(KEY_GLOBAL, JSON.stringify(data));
  saveStatus();
}

function wireAutosave(el, fn){
  el.addEventListener("input", () => {
    window.clearTimeout(wireAutosave.t);
    wireAutosave.t = window.setTimeout(fn, 250);
  });
}

// ---------- Month notes ----------
function loadMonthNotes(activeMonthDate){
  const k = KEY_MONTH_PREFIX + monthKey(activeMonthDate);
  const raw = localStorage.getItem(k);
  monthNotesEl.value = raw ?? "";
}

function saveMonthNotes(activeMonthDate){
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
  const label = activeMonth.toLocaleString(undefined, { month:"long", year:"numeric" });
  monthTitleEl.textContent = label;

  loadMonthNotes(activeMonth);

  // Build a 6-week grid (42 cells) Monday-start
  monthGridEl.innerHTML = "";

  const first = startOfMonth(activeMonth);
  const dim = daysInMonth(activeMonth);

  const startOffset = mondayIndex(first.getDay()); // 0..6
  // Grid starts at "first day of month minus offset"
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  for(let i=0; i<42; i++){
    const c
