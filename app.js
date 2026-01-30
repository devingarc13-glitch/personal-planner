/* =========================
   FIREBASE (ADDED)
   ========================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAFhs0sFJ2WVfOfkelxUX9nttDGuUcvnuo",
  authDomain: "personal-planner-8cf43.firebaseapp.com",
  projectId: "personal-planner-8cf43",
  storageBucket: "personal-planner-8cf43.firebasestorage.app",
  messagingSenderId: "387545435435",
  appId: "1:387545435435:web:0632343d6259de07e5c96e"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

const LOGIN_EMAIL = "devingarcia12347@gmail.com";
let uid = null;

// Firestore doc id safe encoding
const safeId = (s) => s.replace(/[^a-zA-Z0-9:_-]/g, "_");
const refForKey = (key) => doc(db, "users", uid, "planner", safeId(key));

// unsub holders so re-render doesn’t stack listeners
let unsubGlobals = [];
let unsubMonth = null;
let unsubDays = [];

// ✅ Quick Links unsub holders
let unsubQuickLinks = [];

// ---------- DOM ----------
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

// ✅ Quick Links keys (separate sets)
const kQuickLinks = (which) => `planner:global:quickLinks:${which}`; // notes | todo | buy

// ---------- STATUS ----------
function saveStatus(label = "Saved"){
  if (!statusEl) return;
  statusEl.textContent = `${label}: ${new Date().toLocaleTimeString()}`;
}

// ---------- AUTOGROW ----------
function autoGrow(ta){
  const isMobile = window.matchMedia("(max-width: 700px)").matches;
  const MIN = isMobile ? 60 : 110;

  ta.style.height = "0px";
  ta.style.height = Math.max(ta.scrollHeight, MIN) + "px";
}

/* =========================
   DESKTOP-ONLY: PERSIST TEXTAREA SIZES (NEW)
   Saves manual resize heights in localStorage (NOT cloud)
   ========================= */
function isDesktop(){
  return !window.matchMedia("(max-width: 700px)").matches;
}
const kSize = (id) => `planner:ui:taSize:${id}`;

function restoreTextareaSize(el){
  if (!el || !el.id) return;
  if (!isDesktop()) return; // ✅ do nothing on phone
  const h = localStorage.getItem(kSize(el.id));
  if (h) el.style.height = h; // stored as "###px"
}

function saveTextareaSize(el){
  if (!el || !el.id) return;
  if (!isDesktop()) return; // ✅ do nothing on phone
  const h = getComputedStyle(el).height;
  localStorage.setItem(kSize(el.id), h);
}

function wireTextareaSizePersistence(id){
  const el = $(id);
  if (!el) return;

  // restore on load (desktop only)
  restoreTextareaSize(el);

  // save after manual resize (release drag handle)
  el.addEventListener("pointerup", () => saveTextareaSize(el));
  el.addEventListener("mouseup", () => saveTextareaSize(el));

  // also save when leaving the field (covers some browsers)
  el.addEventListener("blur", () => saveTextareaSize(el));
}

/* =========================
   STORAGE LAYER (CHANGED)
   localStorage + Firestore mirror
   ========================= */
async function writeKey(key, value){
  // Always keep local copy as fallback
  localStorage.setItem(key, value);

  if (!uid) {
    saveStatus("Saved locally");
    return;
  }

  try{
    await setDoc(refForKey(key), { value, updatedAt: Date.now() }, { merge: true });
    saveStatus("Saved");
  } catch (e){
    console.error(e);
    saveStatus("Saved locally");
  }
}

function listenKey(key, apply){
  // apply local immediately
  apply(localStorage.getItem(key) || "");

  if (!uid) return () => {};

  // then keep synced from cloud
  return onSnapshot(refForKey(key), (snap) => {
    const val = snap.exists() ? (snap.data().value || "") : "";
    // mirror to local
    localStorage.setItem(key, val);
    apply(val);
  });
}

function clearUnsubs(arr){
  arr.forEach((u) => { try { u(); } catch {} });
  arr.length = 0;
}

/* =========================
   TOP TABS (UNCHANGED)
   ========================= */
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

/* =========================
   CALENDAR TYPE (UNCHANGED)
   ========================= */
document.querySelectorAll(".subtab").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".subtab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    calendarType = btn.dataset.cal; // personal/work/school
    render();
    attachMonthAndDaySync();
  };
});

/* =========================
   CALENDAR RENDER (UNCHANGED UI)
   but reads/writes call writeKey/listenKey
   ========================= */
function render(scrollToToday = false) {
  $("monthTitle").textContent = activeMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const grid = $("monthGrid");
  grid.innerHTML = "";

  // month notes initial fill (cloud listener will overwrite if needed)
  const monthNotesEl = $("monthNotes");
  monthNotesEl.value = localStorage.getItem(kMonth()) || "";

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);

  // Monday-start offset (Mon=0..Sun=6)
  const offset = (firstDay.getDay() + 6) % 7;

  const tISO = todayISO();
  let todayCell = null;

  const TOTAL_CELLS = 42;
  let dayNumber = 1;

  for (let slot = 0; slot < TOTAL_CELLS; slot++) {
    const isSpacer = slot < offset || dayNumber > daysInMonth;

    if (isSpacer) {
      const spacer = document.createElement("div");
      spacer.className = "dayCell spacer";
      spacer.setAttribute("aria-hidden", "true");
      grid.appendChild(spacer);
      continue;
    }

    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), dayNumber);
    const thisISO = iso(date);

    const cell = document.createElement("div");
    cell.className = "dayCell";
    cell.dataset.iso = thisISO;

    if (thisISO === tISO) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = dayNumber;

    const notes = document.createElement("textarea");
    notes.className = "dayNotes";
    notes.value = localStorage.getItem(kDay(date)) || "";

    notes.addEventListener("input", () => {
      writeKey(kDay(date), notes.value);
      notes.style.height = "auto";
      autoGrow(notes);
    });

    cell.append(num, notes);

    // ✅ click-to-focus preserved
    cell.addEventListener("click", (e) => {
      if (e.target !== notes) notes.focus();
    });

    grid.appendChild(cell);

    // ✅ grow AFTER layout is real
    requestAnimationFrame(() => autoGrow(notes));

    if (thisISO === tISO) todayCell = cell;

    dayNumber++;
  }

  if (scrollToToday && todayCell) {
    todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/* =========================
   NAV BUTTONS (UNCHANGED)
   ========================= */
$("prevMonth").onclick = () => {
  activeMonth.setMonth(activeMonth.getMonth() - 1);
  activeMonth.setDate(1);
  render();
  attachMonthAndDaySync();
};

$("nextMonth").onclick = () => {
  activeMonth.setMonth(activeMonth.getMonth() + 1);
  activeMonth.setDate(1);
  render();
  attachMonthAndDaySync();
};

$("todayBtn").onclick = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  render(true);
  attachMonthAndDaySync();
};

/* =========================
   MONTH NOTES (CHANGED)
   ========================= */
$("monthNotes").addEventListener("input", () => {
  writeKey(kMonth(), $("monthNotes").value);
});

/* =========================
   GLOBAL TEXTAREAS (CHANGED)
   ========================= */
function wireGlobal(id) {
  const el = $(id);
  if (!el) return;

  el.value = localStorage.getItem(kGlobal(id)) || "";

  el.addEventListener("input", () => {
    writeKey(kGlobal(id), el.value);
  });
}

wireGlobal("notesPersonal");
wireGlobal("notesHome");
wireGlobal("notesWork");
wireGlobal("notesSchool");
wireGlobal("doAsap");
wireGlobal("doEventually");
wireGlobal("buyNow");
wireGlobal("buyEventually");

/* ✅ Desktop-only textarea size persistence for your main boxes */
wireTextareaSizePersistence("monthNotes");
wireTextareaSizePersistence("notesPersonal");
wireTextareaSizePersistence("notesHome");
wireTextareaSizePersistence("notesWork");
wireTextareaSizePersistence("notesSchool");
wireTextareaSizePersistence("doAsap");
wireTextareaSizePersistence("doEventually");
wireTextareaSizePersistence("buyNow");
wireTextareaSizePersistence("buyEventually");

/* =========================
   QUICK LINKS (NEW)
   - separate bars: notes / todo / buy
   - stored as JSON string via writeKey/listenKey
   ========================= */

// Parse + normalize URL
function normalizeUrl(url){
  let u = (url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function loadLinks(which){
  const raw = localStorage.getItem(kQuickLinks(which)) || "[]";
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(x => x && x.label && x.url) : [];
  } catch {
    return [];
  }
}

function saveLinks(which, links){
  writeKey(kQuickLinks(which), JSON.stringify(links));
}

function renderLinks(which){
  const host = $(`ql-${which}-links`);
  if (!host) return;

  const links = loadLinks(which);
  host.innerHTML = "";

  links.forEach((item, idx) => {
    const a = document.createElement("a");
    a.className = "qlChip";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = item.label;

    const rm = document.createElement("button");
    rm.className = "qlRemove";
    rm.type = "button";
    rm.textContent = "×";
    rm.title = "Remove";

    rm.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const next = loadLinks(which).filter((_, i) => i !== idx);
      saveLinks(which, next);
      renderLinks(which);
    });

    a.appendChild(rm);
    host.appendChild(a);
  });
}

function promptAddLink(which){
  const label = (prompt("Link name (example: USAA, Canvas, Amazon):") || "").trim();
  if (!label) return;

  const url = normalizeUrl(prompt("Paste the link (example: usaa.com):") || "");
  if (!url) return;

  const links = loadLinks(which);
  links.push({ label, url });
  saveLinks(which, links);
  renderLinks(which);
}

function wireQuickLinksUI(){
  const addNotes = $("ql-notes-add");
  const addTodo  = $("ql-todo-add");
  const addBuy   = $("ql-buy-add");

  if (addNotes) addNotes.addEventListener("click", () => promptAddLink("notes"));
  if (addTodo)  addTodo.addEventListener("click", () => promptAddLink("todo"));
  if (addBuy)   addBuy.addEventListener("click", () => promptAddLink("buy"));

  renderLinks("notes");
  renderLinks("todo");
  renderLinks("buy");
}

function attachQuickLinksSync(){
  if (!uid) return;

  clearUnsubs(unsubQuickLinks);

  ["notes","todo","buy"].forEach((which) => {
    const key = kQuickLinks(which);
    const unsub = listenKey(key, (val) => {
      localStorage.setItem(key, val || "[]");
      renderLinks(which);
    });
    unsubQuickLinks.push(unsub);
  });
}

/* =========================
   CLOUD LISTENERS (ADDED)
   keeps boxes growing + clickable
   ========================= */
function attachMonthAndDaySync(){
  if (!uid) return;

  if (unsubMonth) { try { unsubMonth(); } catch {} }
  unsubMonth = listenKey(kMonth(), (val) => {
    const el = $("monthNotes");
    if (el && el.value !== val) el.value = val;
  });

  clearUnsubs(unsubDays);

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);
    const key = kDay(date);

    const unsub = listenKey(key, (val) => {
      const ta = document.querySelector(`.dayCell[data-iso="${iso(date)}"] .dayNotes`);
      if (!ta) return;
      if (ta.value !== val) {
        ta.value = val;
        requestAnimationFrame(() => autoGrow(ta));
      }
    });
    unsubDays.push(unsub);
  }
}

function attachGlobalSync(){
  if (!uid) return;

  clearUnsubs(unsubGlobals);

  const ids = ["notesPersonal","notesHome","notesWork","notesSchool","doAsap","doEventually","buyNow","buyEventually"];
  ids.forEach((id) => {
    const key = kGlobal(id);
    const unsub = listenKey(key, (val) => {
      const el = $(id);
      if (el && el.value !== val) el.value = val;
    });
    unsubGlobals.push(unsub);
  });
}

/* =========================
   AUTH START (ADDED)
   ========================= */
function startLogin(){
  saveStatus("Signing in");
  const pass = prompt("Planner sync password:");
  if (!pass) {
    saveStatus("Sync off");
    return;
  }
  signInWithEmailAndPassword(auth, LOGIN_EMAIL, pass)
    .catch((e) => {
      console.error(e);
      alert("Login failed: " + e.message);
      saveStatus("Login failed");
    });
}

onAuthStateChanged(auth, (user) => {
  if (!user) return;
  uid = user.uid;
  saveStatus("Synced");

  attachGlobalSync();
  attachQuickLinksSync();
  render();
  attachMonthAndDaySync();
});

/* =========================
   INIT (UNCHANGED)
   ========================= */
render();
wireQuickLinksUI(); // ✅ works even before login (local)
startLogin();
