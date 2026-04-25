async function loadTasks() {
 const r = await fetch('/api/tasks');
 const tasks = await r.json();
 document.getElementById('taskList').innerHTML =
 tasks.map(t => '<li>' + t.title + '</li>').join('');
}
async function addTask() {
 const i = document.getElementById('taskInput');
 if (!i.value) return;
 await fetch('/api/tasks', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ title: i.value })
 });
 i.value = ''; loadTasks();
}
loadTasks();
