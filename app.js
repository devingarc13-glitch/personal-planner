const $ = id => document.getElementById(id);
const statusEl = $("status");

let currentCalendar = "personal";
let activeMonth = new Date();
activeMonth.setDate(1);

const monthTitleEl = $("monthTitle");
const monthGridEl = $("monthGrid");
const monthNotesEl = $("monthNotes");

const notesPersonal = $("notesPersonal");
const notesWork = $("notesWork");
const notesSchool = $("notesSchool");

const KEY = {
  day: (cal, iso) => `planner:${cal}:day:${iso}`,
  month: (cal, ym) => `planner:${cal}:month:${ym}`,
  notes: cal => `planner:notes:${cal}`
};

function pad(n){ return String(n).padStart(2,"0"); }
function iso(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function ym(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; }

function saveStatus(){
  statusEl.textContent = `Saved ${new Date().toLocaleTimeString()}`;
}

function autoGrow(el){
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function renderMonth(){
  monthTitleEl.textContent = activeMonth.toLocaleString(undefined,{month:"long",year:"numeric"});
  monthGridEl.innerHTML = "";

  const days = new Date(activeMonth.getFullYear(), activeMonth.getMonth()+1, 0).getDate();

  for(let d=1; d<=days; d++){
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);
    const dayISO = iso(date);

    const cell = document.createElement("div");
    cell.className = "dayCell";

    const num = document.createElement("div");
    num.className = "dayNum";
    num.textContent = d;

    const ta = document.createElement("textarea");
    ta.className = "dayNotes";
    ta.value = localStorage.getItem(KEY.day(currentCalendar, dayISO)) || "";
    autoGrow(ta);

    ta.addEventListener("input", () => {
      autoGrow(ta);
      localStorage.setItem(KEY.day(currentCalendar, dayISO), ta.value);
      saveStatus();
    });

    cell.append(num, ta);
    monthGridEl.appendChild(cell);
  }

  monthNotesEl.value = localStorage.getItem(KEY.month(currentCalendar, ym(activeMonth))) || "";
}

monthNotesEl.addEventListener("input", () => {
  localStorage.setItem(KEY.month(currentCalendar, ym(activeMonth)), monthNotesEl.value);
  saveStatus();
});

document.querySelectorAll(".calBtn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".calBtn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentCalendar = btn.dataset.cal;
    renderMonth();
  });
});

$("prevMonth").onclick = () => { activeMonth.setMonth(activeMonth.getMonth()-1); renderMonth(); };
$("nextMonth").onclick = () => { activeMonth.setMonth(activeMonth.getMonth()+1); renderMonth(); };
$("todayBtn").onclick = () => { activeMonth = new Date(); activeMonth.setDate(1); renderMonth(); };

document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    $(`tab-${btn.dataset.tab}`).classList.add("active");
  };
});

[notesPersonal, notesWork, notesSchool].forEach((el, i)=>{
  const key = ["personal","work","school"][i];
  el.value = localStorage.getItem(KEY.notes(key)) || "";
  el.addEventListener("input", ()=>{
    localStorage.setItem(KEY.notes(key), el.value);
    saveStatus();
  });
});

renderMonth();
