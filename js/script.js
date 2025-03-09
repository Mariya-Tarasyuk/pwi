document.addEventListener("DOMContentLoaded", function () {
    const mainCheckbox = document.querySelector("th input[type='checkbox']");
    const studentCheckboxes = document.querySelectorAll("td input[type='checkbox']");
    const statusIcons = document.querySelectorAll("td i.fa-circle");

    // Встановлюємо початковий статус студентів (кожен другий активний)
    statusIcons.forEach((icon, index) => {
        if (index % 2 === 0) {
            icon.style.color = "green"; // Активний
            icon.dataset.status = "active";
        } else {
            icon.style.color = "gray"; // Неактивний
            icon.dataset.status = "inactive";
        }
    });

    // Обробник для глобального чекбокса
    mainCheckbox.addEventListener("change", function () {
        studentCheckboxes.forEach(cb => cb.checked = mainCheckbox.checked);
    });

    // Обробник для індивідуальних чекбоксів
    studentCheckboxes.forEach(cb => {
        cb.addEventListener("change", function () {
            mainCheckbox.checked = [...studentCheckboxes].every(cb => cb.checked);
        });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const addStudentBtn = document.querySelector(".add-student-btn");
    const addStudentForm = document.getElementById("addStudentForm");
    const cancelBtn = document.getElementById("cancelBtn");
    const studentForm = document.getElementById("studentForm");
    const table = document.querySelector("table");

    // Показати форму для додавання студента
    addStudentBtn.addEventListener("click", function () {
        addStudentForm.classList.remove("hidden");
    });

    // Сховати форму при натисканні на Cancel
    cancelBtn.addEventListener("click", function () {
        addStudentForm.classList.add("hidden");
    });

    // Обробник для додавання нового студента до таблиці
    studentForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const group = document.getElementById("group").value;
        const name = document.getElementById("name").value;
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;

        // Створення нового рядка таблиці
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${group}</td>
            <td>${name}</td>
            <td>${gender}</td>
            <td>${birthday}</td>
            <td><i class="fa-solid fa-circle"></i></td>
            <td><i class="fa-solid fa-pen"></i>
                <i class="fa-solid fa-xmark"></i></td>
        `;

        // Додавання нового студента до таблиці
        table.appendChild(newRow);

        // Сховати форму
        addStudentForm.classList.add("hidden");

        // Очистити поля форми
        studentForm.reset();
    });
});
