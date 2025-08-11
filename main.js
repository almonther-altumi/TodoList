// عناصر DOM
let add_button = document.getElementById("add_btn");
let todo_input = document.getElementById("todo_input");
let todo_list = document.getElementById("todo_list");
let delete_btn = document.getElementById("delete_btn");
let clear_btn = document.getElementById("clear_btn");
let edit_btn = document.getElementById("edit_btn");

let counter = 0;

// وظيفة لإنشاء عنصر المهمة
function createTodoItem(todo_text) {
   
    let listItem = document.createElement("li");
    let textSpan = document.createElement("span");
    let checkbox = document.createElement("input");
    let deleteItemBtn = document.createElement("button");
    let deleteIcon = document.createElement("img");
    let editButton = document.createElement("button");
    let editIcon = document.createElement("img");
    
    // إعداد النص الخاص بالمهمة
    textSpan.textContent = todo_text;

    // إعداد الـ checkbox
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";

    // إعداد زر الحذف
    deleteIcon.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAmElEQVRIS2NkoDFgpLH5DIQs8Ac6oAOINXA45DpQvASIt+FyKCELXgA1ihPw5T2gvDK5FvyHasTlEELyBIOIkAGE5DEsgGmgNO7hPkb3Os0tgLmcoNfRvIhTPdmRN2rBaBzA08BoKiKYMYdvED0E+l2OxCL1AVC9IroeXEEEqio7gVidSEsuAdVVYqs6CVWZRJqPWxnNLQAApWYoGWzszqgAAAAASUVORK5CYII=";
    deleteIcon.alt = "Delete";

    deleteItemBtn.appendChild(deleteIcon);
    deleteItemBtn.style.cursor = "pointer";

    deleteIcon.className = "deleteIcon_listItem";
    deleteItemBtn.className = "deleteBtn_listItem";
    //note
    // إعداد زر التعديل
    editIcon.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABOElEQVRIS2NkoDFgpLH5DNS0oBvo2JdA3IPsaHQL/IGSHUCsgcdn/4FysUC8FEnNZCA7B8ovRbYE3YInQElpEg0XA6q/DMQgGgaqgYw2EAfdApDrsInjslMAKPEBiFWA+DAQS0AVVgHpdkotKAEaAMJWQHwPiJWA+BgQtwDxFJiLyPVBBcyFQPo5ENsB8R0g5gfij8jeJceCSlj4IhkEskQXiN+ihyWpFoCCBJQc0QEoaYJSDwYgxQJiDfcA2rKD1DhoAGqoJ8LlIMPXAzEnKRaADAZZQEyw/AAqYgdieMgQE0SwvIFsAa4wx8hH5FgA8k0jtggFilFsAUo5g8USsizA4ViswiPAgodAj8uREiZY1D4AiiniygegCqcTiNXJtOQSUB+orNqGywIyzcWtjZp1MlZbaG4BAJ1TRBn/3k7mAAAAAElFTkSuQmCC";
    editIcon.alt = "Edit";

    editButton.appendChild(editIcon);
    editButton.style.cursor = "pointer";

    editButton.className = 'editBtn_listItem';
    editIcon.className = 'editIcon_listItem';

    // ترتيب العناصر داخل العنصر <li>
    listItem.appendChild(checkbox); // إضافة الـ checkbox أولاً
    listItem.appendChild(textSpan); // النص بعد الـ checkbox
    listItem.appendChild(deleteItemBtn);
    listItem.appendChild(editButton);

    // إعداد العنصر <li>
    listItem.className = "list" + counter;
    listItem.style.alignItems = "center";
    listItem.style.padding = "10px";
    listItem.style.textDecoration = "none";

    // أحداث
    checkbox.addEventListener("change", function () {
        listItem.style.textDecoration = checkbox.checked ? "line-through" : "none";
    });

    deleteItemBtn.addEventListener("click", function () {
        todo_list.removeChild(listItem);
    });

    editButton.addEventListener("click", function () {
        todo_input.value = textSpan.textContent.trim();
        todo_list.removeChild(listItem);
        counter--;
    });

    return listItem
    
}
// إضافة حدث عند الضغط على زر "Enter" في حقل الإدخال
todo_input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        let todo_text = todo_input.value.trim();
        if (todo_text === "") {
            return;
        }

        counter++;
        let listItem = createTodoItem(todo_text);
        todo_list.appendChild(listItem);

        todo_input.value = "";
        todo_input.focus();
    }
});
// إضافة مهمة جديدة
add_button.addEventListener("click", function () {
    let todo_text = todo_input.value.trim();
    if (todo_text === "") {
        return;
    }

    counter++;
    let listItem = createTodoItem(todo_text);
    todo_list.appendChild(listItem);

    todo_input.value = "";
    todo_input.focus();
});

// حذف جميع العناصر
clear_btn.addEventListener("click", function () {
    todo_list.innerHTML = "<h2>Tasks</h2>";
    todo_input.value = "";
    counter = 0;
});

// تعديل آخر عنصر
edit_btn.addEventListener("click", function () {
    let lastItem = todo_list.lastElementChild;
    if (lastItem) {
        let textSpan = lastItem.querySelector("span");
        if (textSpan) {
            todo_input.value = textSpan.textContent.trim();
            todo_list.removeChild(lastItem);
            counter--;
        }
    }
});

delete_btn.addEventListener("click", function () {
    // الحصول على جميع العناصر <li> داخل القائمة
    let lastItem = todo_list.querySelector("li:last-child");
    if (lastItem) {
        todo_list.removeChild(lastItem);
        counter--;
    }
    todo_input.value = "";
});
//idea: إضافة حدث عند تحميل الصفحة


