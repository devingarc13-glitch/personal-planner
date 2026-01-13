const $ = id => document.getElementById(id);
const statusEl = $("status");

const monthTitle = $("monthTitle");
const grid = $("monthGrid");
const monthNotes = $("monthNotes");

let activeCal = "personal";
let activeMonth = new Date();
activeMonth.setDate(1);

const KEYS = {
  day: (cal, iso) => `planner:${cal}:day:${iso}`,
  month: (cal, ym) => `planner:${cal}:month:${ym}`,
  global: k => `planner:global:${k}`
};

function iso(d){
  return d.toISOString().slice(0,10);
}

function ym(d){
  return d.toISOString().slice(0,7);
}

function render(){
  grid.innerHTML = "";
  monthTitle.textContent = activeMonth.toLocaleString(undefined,{month:"long",year:"numeric"});
  monthNotes.value = localStorage.getItem(KEYS.month(activeCal, ym(activeMonth))) || "";

  const days = new Date(activeMonth.getFullYear(), activeMonth.getMonth()+1,0).getDate();
  const start = (new Date(activeMonth).getDay()+6)%7;

  for(let i=0;i<start;i++) grid.appendChild(document.createElement("div"));

  for(let d=1;d<=days;d++){
    const cell = document.createElement("div");
    cell.className="dayCell";

    const num = document.createElement("div");
    num.className="dayNum";
    num.textContent=d;

    const ta = document.createElement("textarea");
    ta.className="dayNotes";

    const date = new Date(activeMonth);
    date.setDate(d);
    const key = KEYS.day(activeCal, iso(date));

    ta.value = localStorage.getItem(key) || "";
    ta.oninput = () => localStorage.setItem(key, ta.value);

    cell.append(num, ta);
    grid.appendChild(cell);
  }
}

$("prevMonth").onclick = ()=>{ activeMonth.setMonth(activeMonth.getMonth()-1); render(); }
$("nextMonth").onclick = ()=>{ activeMonth.setMonth(activeMonth.getMonth()+1); render(); }
$("todayBtn").onclick = ()=>{ activeMonth = new Date(); activeMonth.setDate(1); render(); }

monthNotes.oninput = ()=>{
  localStorage.setItem(KEYS.month(activeCal, ym(activeMonth)), monthNotes.value);
};

document.querySelectorAll(".tab").forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    t.classList.add("active");
    $(`tab-${t.dataset.tab}`).classList.add("active");
  }
});

document.querySelectorAll(".subtab").forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll(".subtab").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    activeCal=b.dataset.cal;
    render();
  }
});

["doAsap","doEventually","buyNow","buyEventually",
 "notes-personal","notes-work","notes-school"].forEach(id=>{
   const el=$(id);
   el.value = localStorage.getItem(KEYS.global(id))||"";
   el.oninput=()=>localStorage.setItem(KEYS.global(id), el.value);
 });

render();
