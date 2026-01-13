const $ = (id) => document.getElementById(id);

const dateEl = $("date");
const todayBtn = $("todayBtn");
const statusEl = $("status");

const mainWinEl = $("mainWin");
const todoInputEl = $("todoInput");
const addTodoBtn = $("addTodoBtn");
const todoListEl = $("todoList");

const asapEl = $("asap");
const buyNowEl = $("buyNow");
const schoolEl = $("school");
const homeEl = $("home");
const notesEl = $("notes");

function todayISO(){
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function keyFor(date){
  return `planner:v1:${date}`;
}

function load(date){
  const raw = localStorage.getItem(keyFor(date));
  const data = raw ? JSON.parse(raw) : {
    mainWin: "",
    todos: [],
    asap: "",
    buyNow: "",
    school: "",
    home: "",
    notes: ""
  };

  mainWinEl.value = data.mainWin;
  asapEl.value = data.asap;
  buyNowEl.value = data.buyNow;
  schoolEl.value = data.school;
  homeEl.value = data.home;
  notesEl.value = data.notes;

  renderTodos(data.todos);
}

function save(){
  const date = dateEl.value;
  if(!date) return;

  const data = {
    mainWin: mainWinEl.value,
    todos: readTodos(),
    asap: asapEl.value,
    buyNow: buyNowEl.value,
    school: schoolEl.value,
    home: homeEl.value,
    notes: notesEl.value
  };

  localStorage.setItem(keyFor(date), JSON.stringify(data));
  statusEl.textContent = `Saved: ${new Date().toLocaleTimeString()}`;
}

function renderTodos(todos){
  todoListEl.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    if(t.done) li.classList.add("done");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!t.done;
    cb.addEventListener("change", () => {
      const items = readTodos();
      items[i].done = cb.checked;
      renderTodos(items);
      save();
    });

    const span = document.createElement("span");
    span.textContent = t.text;

    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      const items = readTodos();
      items.splice(i, 1);
      renderTodos(items);
      save();
    });

    li.append(cb, span, del);
    todoListEl.appendChild(li);
  });
}

function readTodos(){
  const items = [];
  todoListEl.querySelectorAll("li").forEach(li => {
    const text = li.querySelector("span")?.textContent ?? "";
    const done = li.classList.contains("done") || li.querySelector("input")?.checked;
    items.push({ text, done: !!done });
  });
  return items;
}

function addTodo(){
  const text = todoInputEl.value.trim();
  if(!text) return;

  const existing = readTodos();
  existing.push({ text, done:false });
  renderTodos(existing);
  todoInputEl.value = "";
  save();
}

function wireAutosave(el){
  el.addEventListener("input", () => {
    window.clearTimeout(wireAutosave.t);
    wireAutosave.t = window.setTimeout(save, 250);
  });
}

dateEl.addEventListener("change", () => load(dateEl.value));
todayBtn.addEventListener("click", () => {
  dateEl.value = todayISO();
  load(dateEl.value);
});

addTodoBtn.addEventListener("click", addTodo);
todoInputEl.addEventListener("keydown", (e) => {
  if(e.key === "Enter") addTodo();
});

[mainWinEl, asapEl, buyNowEl, schoolEl, homeEl, notesEl].forEach(wireAutosave);

// Init
dateEl.value = todayISO();
load(dateEl.value);
