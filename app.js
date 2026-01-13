const $ = id => document.getElementById(id);

// ---------- STATE ----------
let activeMonth = new Date();
activeMonth.setDate(1);
let calendarType = "personal";

// ---------- HELPERS ----------
const pad = n => String(n).padStart(2,"0");
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

// ---------- STORAGE ----------
const kDay = d => `day:${calendarType}:${iso(d)}`;
const kMonth = () => `month:${calendarType}:${monthKey(activeMonth)}`;

// ---------- TABS ----------
document.querySelectorAll(".tab").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".tab").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    btn.classList.add("active");
    $(`tab-${btn.dataset.tab}`).classList.add("active");
  };
});

// ---------- CALENDAR TYPE ----------
document.querySelectorAll(".calType").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".calType").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    calendarType = btn.dataset.type;
    render();
  };
});

// ---------- CALENDAR ----------
function render(){
  $("monthTitle").textContent =
    activeMonth.toLocaleString(undefined,{month:"long",year:"numeric"});

  $("monthGrid").innerHTML = "";
  $("monthNotes").value = localStorage.getItem(kMonth()) || "";

  const days = new Date(activeMonth.getFullYear(), activeMonth.getMonth()+1, 0).getDate();
  const offset = (new Date(activeMonth.getFullYear(), activeMonth.getMonth(),1).getDay()+6)%7;

  for(let i=0;i<offset;i++) $("monthGrid").appendChild(document.createElement("div"));

  for(let d=1; d<=days; d++){
    const date = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), d);
    const box = document.createElement("div");
    box.className="day";

    const n = document.createElement("div");
    n.className="dayNum";
    n.textContent=d;

    const t = document.createElement("textarea");
    t.value = localStorage.getItem(kDay(date)) || "";
    t.oninput=()=>localStorage.setItem(kDay(date),t.value);

    box.append(n,t);
    $("monthGrid").appendChild(box);
  }
}

// ---------- NAV ----------
$("prevMonth").onclick=()=>{
  activeMonth.setMonth(activeMonth.getMonth()-1); render();
};
$("nextMonth").onclick=()=>{
  activeMonth.setMonth(activeMonth.getMonth()+1); render();
};
$("todayBtn").onclick=()=>{
  activeMonth=new Date(); activeMonth.setDate(1); render();
};

// ---------- GLOBAL NOTES ----------
["notesGlobal","todoText","buyText"].forEach(id=>{
  const el=$(id);
  el.value=localStorage.getItem(id)||"";
  el.oninput=()=>localStorage.setItem(id,el.value);
});

// ---------- MONTH NOTES ----------
$("monthNotes").oninput=()=>localStorage.setItem(kMonth(),$("monthNotes").value);

// ---------- INIT ----------
render();
