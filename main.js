// DOM elements
const add_button = document.getElementById("add_btn");
const todo_input = document.getElementById("todo_input");
const todo_list = document.getElementById("todo_list");
const delete_btn = document.getElementById("delete_btn");
const clear_btn = document.getElementById("clear_btn");
const edit_btn = document.getElementById("edit_btn");
const clear_completed_btn = document.getElementById("clear_completed");
const count_total = document.getElementById("count_total");
const count_active = document.getElementById("count_active");
const filter_buttons = document.querySelectorAll(".filter-btn");
const due_date_input = document.getElementById("due_date");
const priority_select = document.getElementById("priority_select");
const undo_btn = document.getElementById("undo_btn");
const priority_filter = document.getElementById("priority_filter");
const sort_select = document.getElementById("sort_select");
const search_input = document.getElementById('search_input');
// undo_btn already declared earlier in the file via index.html wiring
const export_btn = document.getElementById('export_btn');
const import_btn = document.getElementById('import_btn');
const import_input = document.getElementById('import_input');

let todos = []; // { id, text, completed, priority, due, createdAt }
let editId = null;
let undoStack = []; // stack of { item, index }
let currentPriorityFilter = 'all';
let currentSort = 'newest';

// helpers
function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function loadTodos() {
    const raw = localStorage.getItem("todos");
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            // normalize older todo shapes
            todos = parsed.map(t => ({
                id: t.id || uid(),
                text: t.text || "",
                completed: !!t.completed,
                priority: t.priority || 'medium',
                due: t.due || null,
                star: !!t.star,
                createdAt: t.createdAt || Date.now()
            }));
        } catch (e) {
            todos = [];
        }
    }
}

// give a readable relative label for due dates
function relativeDueLabel(due) {
    if (!due) return { label: '', cls: '' };
    try {
        const d = new Date(due);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
        if (isNaN(diff)) return { label: '', cls: '' };
        if (diff < 0) return { label: 'Overdue', cls: 'due-overdue' };
        if (diff === 0) return { label: 'Today', cls: 'due-today' };
        if (diff === 1) return { label: 'Tomorrow', cls: 'due-tomorrow' };
        if (diff <= 7) return { label: `In ${diff}d`, cls: 'due-soon' };
        return { label: '', cls: '' };
    } catch (e) { return { label: '', cls: '' }; }
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// priority display helpers (Arabic)
function priorityLabel(p) {
    if (!p) return '';
    if (p === 'high') return 'عالي';
    if (p === 'medium') return 'متوسط';
    if (p === 'low') return 'منخفض';
    return p;
}

function priorityInitial(p) {
    if (!p) return '';
    if (p === 'high') return 'ع';
    if (p === 'medium') return 'م';
    if (p === 'low') return 'ن';
    return p.charAt(0).toUpperCase();
}

// rendering
function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";
    checkbox.checked = !!todo.completed;

    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text;

    const meta = document.createElement('div');
    meta.className = 'todo-meta';
    const parts = [];
    if (todo.due) parts.push(`تاريخ: ${formatDate(todo.due)}`);
    if (todo.priority) parts.push(`الأولوية: ${priorityLabel(todo.priority)}`);
    meta.textContent = parts.join(' • ');
    // priority badge
    const badge = document.createElement('span');
    badge.className = `priority-badge ${todo.priority || 'medium'}`;
    badge.textContent = priorityInitial(todo.priority || 'medium');
    // due label
    const dueLabel = relativeDueLabel(todo.due);
    if (dueLabel.label) {
        const dl = document.createElement('span');
        dl.className = `due-label ${dueLabel.cls}`;
        dl.textContent = dueLabel.label;
        meta.appendChild(dl);
    }

    const btnDelete = document.createElement("button");
    btnDelete.className = "deleteBtn_listItem";
    btnDelete.title = "Delete";
    btnDelete.innerHTML = '<img class="deleteIcon_listItem" alt="Delete" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAmElEQVRIS2NkoDFgpLH5DIQs8Ac6oAOINXA45DpQvASIt+FyKCELXgA1ihPw5T2gvDK5FvyHasTlEELyBIOIkAGE5DEsgGmgNO7hPkb3Os0tgLmcoNfRvIhTPdmRN2rBaBzA08BoKiKYMYdvED0E+l2OxCL1AVC9IroeXEEEqio7gVidSEsuAdVVYqs6CVWZRJqPWxnNLQAApWYoGWzszqgAAAAASUVORK5CYII=">';

    const favBtn = document.createElement('button');
    favBtn.className = 'fav-btn';
    favBtn.title = 'Favorite';
    favBtn.innerHTML = todo.star ? '★' : '☆';
    if (todo.star) favBtn.classList.add('starred');

    const btnEdit = document.createElement("button");
    btnEdit.className = "editBtn_listItem";
    btnEdit.title = "Edit";
    btnEdit.innerHTML = '<img class="editIcon_listItem" alt="Edit" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABOElEQVRIS2NkoDFgpLH5DNS0oBvo2JdA3IPsaHQL/IGSHUCsgcdn/4FysUC8FEnNZCA7B8ovRbYE3YInQElpEg0XA6q/DMQgGgaqgYw2EAfdApDrsInjslMAKPEBiFWA+DAQS0AVVgHpdkotKAEaAMJWQHwPiJWA+BgQtwDxFJiLyPVBBcyFQPo5ENsB8R0g5gfij8jeJceCSlj4IhkEskQXiN+ihyWpFoCCBJQc0QEoaYJSDwYgxQJiDfcA2rKD1DhoAGqoJ8LlIMPXAzEnKRaADAZZQEyw/AAqYgdieMgQE0SwvIFsAa4wx8hH5FgA8k0jtggFilFsAUo5g8USsizA4ViswiPAgodAj8uREiZY1D4AiiniygegCqcTiNXJtOQSUB+orNqGywIyzcWtjZp1MlZbaG4BAJ1TRBn/3k7mAAAAAElFTkSuQmCC">';

    // style when completed
    if (todo.completed) {
        span.style.textDecoration = "line-through";
    }

    // style overdue
    if (todo.due) {
        const dueDate = new Date(todo.due);
        const now = new Date();
        if (!todo.completed && dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            li.classList.add('overdue');
        }
    }

    // events
    checkbox.addEventListener("change", () => {
        todo.completed = checkbox.checked;
        if (todo.completed) span.style.textDecoration = "line-through";
        else span.style.textDecoration = "none";
        saveTodos();
        updateCounts();
        applyFilter(currentFilter);
    });

    btnDelete.addEventListener("click", () => {
        const idx = todos.findIndex(t => t.id === todo.id);
        if (idx !== -1) {
            undoStack.push({ item: todos[idx], index: idx });
            // cap undo stack
            if (undoStack.length > 20) undoStack.shift();
            todos.splice(idx, 1);
            saveTodos();
            renderList();
        }
    });

    favBtn.addEventListener('click', () => {
        todo.star = !todo.star;
        saveTodos();
        // toggle visual quickly
        if (todo.star) favBtn.classList.add('starred'); else favBtn.classList.remove('starred');
        favBtn.innerHTML = todo.star ? '★' : '☆';
        updateCounts();
    });

    btnEdit.addEventListener("click", () => {
        editId = todo.id;
        todo_input.value = todo.text;
        if (due_date_input) due_date_input.value = todo.due || '';
        if (priority_select) priority_select.value = todo.priority || 'medium';
        todo_input.focus();
    });

    li.appendChild(checkbox);
    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';
    left.style.flex = '1';
    left.appendChild(span);
    left.appendChild(meta);
    li.appendChild(left);
    const rightGroup = document.createElement('div');
    rightGroup.style.display = 'flex';
    rightGroup.style.gap = '8px';
    rightGroup.appendChild(favBtn);
    rightGroup.appendChild(btnDelete);
    rightGroup.appendChild(btnEdit);
    li.appendChild(rightGroup);

    return li;
}

function renderList() {
    todo_list.innerHTML = "";
    let filtered = todos.filter(filterPredicate[currentFilter]);
    const query = (search_input && search_input.value || '').trim().toLowerCase();
    if (query) filtered = filtered.filter(t => (t.text||'').toLowerCase().includes(query));
    if (currentPriorityFilter && currentPriorityFilter !== 'all') {
        filtered = filtered.filter(t => (t.priority || 'medium') === currentPriorityFilter);
    }

    // sorting
    filtered = filtered.slice();
    if (currentSort === 'newest') filtered.sort((a,b) => b.createdAt - a.createdAt);
    else if (currentSort === 'oldest') filtered.sort((a,b) => a.createdAt - b.createdAt);
    else if (currentSort === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        filtered.sort((a,b) => (order[a.priority||'medium'] - order[b.priority||'medium']));
    } else if (currentSort === 'due') {
        filtered.sort((a,b) => {
            if (!a.due && !b.due) return 0;
            if (!a.due) return 1;
            if (!b.due) return -1;
            return new Date(a.due) - new Date(b.due);
        });
    }

    filtered.forEach(t => todo_list.appendChild(createTodoElement(t)));
    updateCounts();
}

function updateCounts() {
    count_total.textContent = todos.length;
    count_active.textContent = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;
    const overdue = todos.filter(t => {
        if (!t.due) return false;
        if (t.completed) return false;
        const dueDate = new Date(t.due);
        const now = new Date();
        return dueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }).length;
    const starred = todos.filter(t => t.star).length;
    const elCompleted = document.getElementById('count_completed');
    const elOverdue = document.getElementById('count_overdue');
    const elStar = document.getElementById('count_starred');
    if (elCompleted) elCompleted.textContent = completed;
    if (elOverdue) elOverdue.textContent = overdue;
    if (elStar) elStar.textContent = starred;
}

// filters
let currentFilter = 'all';
const filterPredicate = {
    all: () => true,
    active: t => !t.completed,
    completed: t => t.completed,
};

function applyFilter(filter) {
    currentFilter = filter;
    filter_buttons.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
    renderList();
}

// actions
function addTodo(text) {
    if (!text) return;
    const due = due_date_input ? (due_date_input.value || null) : null;
    const priority = priority_select ? (priority_select.value || 'medium') : 'medium';

    if (editId) {
        // save edit
        const idx = todos.findIndex(t => t.id === editId);
        if (idx !== -1) {
            todos[idx].text = text;
            todos[idx].due = due;
            todos[idx].priority = priority;
        }
        editId = null;
    } else {
        todos.push({ id: uid(), text, completed: false, priority, due, createdAt: Date.now() });
    }
    saveTodos();
    todo_input.value = '';
    if (due_date_input) due_date_input.value = '';
    if (priority_select) priority_select.value = 'medium';
    renderList();
}

// wire events
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderList();
    // random motivational word (Arabic)
    const motivational_words_text = document.getElementById("motivational-words");
    const motivational_words = ['لا تستسلم!', 'ابق مركزًا!', 'خطوة واحدة في كل مرة.'];
    const random_index = Math.floor(Math.random() * motivational_words.length);
    if (motivational_words_text) motivational_words_text.textContent = motivational_words[random_index];
});

todo_input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        addTodo(todo_input.value.trim());
    }
});

add_button.addEventListener("click", function () {
    addTodo(todo_input.value.trim());
});

delete_btn.addEventListener("click", function () {
    // delete last visible item according to current filter
    const list = todo_list.querySelectorAll('li');
    const last = list[list.length - 1];
    if (last) {
        const id = last.dataset.id;
        const idx = todos.findIndex(t => t.id === id);
        if (idx !== -1) {
            undoStack.push({ item: todos[idx], index: idx });
            if (undoStack.length > 20) undoStack.shift();
            todos.splice(idx, 1);
            saveTodos();
            renderList();
        }
    }
    todo_input.value = "";
});

clear_btn.addEventListener("click", function () {
    // normal click: clear completed
    if (event && event.shiftKey) {
        // shift+click -> clear all with confirmation
                if (confirm('هل تريد مسح كل المهام؟ لا يمكن التراجع عن هذا الإجراء.')) {
            todos = [];
            saveTodos();
            renderList();
        }
    } else {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderList();
    }
    todo_input.value = "";
});

edit_btn.addEventListener("click", function () {
    // edit last item
    const last = todos[todos.length - 1];
    if (last) {
        editId = last.id;
        todo_input.value = last.text;
        if (due_date_input) due_date_input.value = last.due || '';
        if (priority_select) priority_select.value = last.priority || 'medium';
        todo_input.focus();
    }
});

if (clear_completed_btn) {
clear_completed_btn.addEventListener('click', () => {
    todos = todos.filter(t => !t.completed);
    saveTodos();
    renderList();
});
}

// undo support
if (undo_btn) undo_btn.addEventListener('click', () => {
    const op = undoStack.pop();
    if (op && op.item) {
        const idx = Math.min(Math.max(op.index, 0), todos.length);
        todos.splice(idx, 0, op.item);
        saveTodos();
        renderList();
    }
});

// priority filter
if (priority_filter) priority_filter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value || 'all';
    renderList();
});

// sort select
if (sort_select) sort_select.addEventListener('change', (e) => {
    currentSort = e.target.value || 'newest';
    renderList();
});

// keyboard shortcut: Ctrl+Z to undo
document.addEventListener('keydown', (e) => {
    // Ctrl+Z multi-undo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        const op = undoStack.pop();
        if (op && op.item) {
            const idx = Math.min(Math.max(op.index, 0), todos.length);
            todos.splice(idx, 0, op.item);
            saveTodos();
            renderList();
        }
    }
    // Ctrl+Enter to add quickly
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        addTodo(todo_input.value.trim());
    }
});

filter_buttons.forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

// export/import
if (export_btn) export_btn.addEventListener('click', () => {
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'todos-export.json';
    a.click();
    URL.revokeObjectURL(url);
});

if (import_btn && import_input) import_btn.addEventListener('click', () => import_input.click());
if (import_input) import_input.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const parsed = JSON.parse(ev.target.result);
            if (Array.isArray(parsed)) {
                // merge: keep existing ids where possible
                parsed.forEach(p => {
                    p.id = p.id || uid();
                    p.createdAt = p.createdAt || Date.now();
                    p.priority = p.priority || 'medium';
                    p.completed = !!p.completed;
                });
                todos = parsed.concat(todos);
                saveTodos();
                renderList();
            }
        } catch (err) { console.error('فشل الاستيراد', err); alert('فشل الاستيراد: الملف غير صالح'); }
    };
    reader.readAsText(f);
});

// helper: date formatter
function formatDate(d) {
    try {
        const dt = new Date(d);
        if (isNaN(dt)) return d;
        return dt.toLocaleDateString();
    } catch (e) { return d; }
}
