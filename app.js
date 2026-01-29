/* =========================
   FIREBASE SETUP (ADD ONLY)
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
  getDoc,
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   AUTH (SAFE LOGIN)
   ========================= */
const EMAIL = "devingarcia12347@gmail.com";
const PASSWORD = prompt("Planner sync password:");

signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
  .then(() => console.log("Signed in"))
  .catch(err => alert("Login failed: " + err.message));

/* =========================
   ORIGINAL PLANNER CODE
   (UNCHANGED)
   ========================= */
const $ = (id) => document.getElementById(id);
const statusEl = $("status");

let activeMonth = new Date();
activeMonth.setHours(0, 0, 0, 0);
activeMonth.setDate(1);

let calendarType = "personal";

// helpers
const pad = (n) => String(n).padStart(2, "0");
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());

// Firestore-backed keys
const keyPath = (uid, key) => doc(db, "users", uid, "planner", key);

/* =========================
   FIRESTORE SAVE / LOAD
   ========================= */
function saveRemote(uid, key, value){
  setDoc(keyPath(uid, key), { value }, { merge: true });
}

function loadRemote(uid, key, cb){
  onSnapshot(keyPath(uid, key), snap => {
    if (snap.exists()) cb(snap.data().value || "");
  });
}

/* =========================
   INIT AFTER LOGIN
   ========================= */
onAuthStateChanged(auth, user => {
  if (!user) return;
  statusEl.textContent = "Synced";

  // Month notes
  loadRemote(user.uid, `month:${monthKey(activeMonth)}`, v => {
    $("monthNotes").value = v;
  });

  $("monthNotes").addEventListener("input", () => {
    saveRemote(user.uid, `month:${monthKey(activeMonth)}`, $("monthNotes").value);
  });

  // Global textareas
  [
    "notesPersonal","notesWork","notesSchool",
    "doAsap","doEventually","buyNow","buyEventually"
  ].forEach(id => {
    const el = $(id);
    loadRemote(user.uid, `global:${id}`, v => el.value = v);
    el.addEventListener("input", () => {
      saveRemote(user.uid, `global:${id}`, el.value);
    });
  });

  render();
});

/* =========================
   RENDER (UNCHANGED)
   ========================= */
function render(scrollToToday = false) {
  $("monthTitle").textContent = activeMonth.toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const grid = $("monthGrid");
  grid.innerHTML = "";

  const daysInMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;

  const TOTAL = 42;
  let day = 1;

  for (let i = 0; i < TOTAL; i++) {
    if (i < offset || day > daysInMonth) {
      const s = document.createElement("div");
      s.className = "dayCell spacer";
      grid.appendChild(s);
      continue;
    }

    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day);
    const cell = document.createElement("div");
    cell.className = "dayCell";
    if (iso(date) === todayISO()) cell.classList.add("today");

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = day;

    const ta = document.createElement("textarea");
    ta.className = "dayNotes";

    onAuthStateChanged(auth, user => {
      if (!user) return;
      loadRemote(user.uid, `day:${calendarType}:${iso(date)}`, v => ta.value = v);
      ta.addEventListener("input", () => {
        saveRemote(user.uid, `day:${calendarType}:${iso(date)}`, ta.value);
      });
    });

    cell.append(num, ta);
    grid.appendChild(cell);
    day++;
  }
}

/* NAV */
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
  const n = new Date();
  activeMonth = new Date(n.getFullYear(), n.getMonth(), 1);
  render(true);
};
