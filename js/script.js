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
    const closeBtn = document.getElementById("closeBtn");
    const studentForm = document.getElementById("studentForm");
    const table = document.querySelector("table");
    const okBtn = document.getElementById("okBtn");
    const addStudentButton = document.getElementById("addBtn");

    // Показати форму для додавання студента
    addStudentBtn.addEventListener("click", function () {
        addStudentForm.classList.remove("hidden");
    });

    // Сховати форму при натисканні на хрестик
    closeBtn.addEventListener("click", function () {
        addStudentForm.classList.add("hidden");
    });

    // Перетворення дати в формат дд-мм-рррр
    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0"); // Місяці з 0
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }

    // Кнопка OK: просто закриває форму або додає запис, без додаткових перевірок
    okBtn.addEventListener("click", function () {
        const group = document.getElementById("group").value;
        const name = document.getElementById("name").value;
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;

        if (group && name && gender && birthday) {
            // Створення нового рядка таблиці
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${group}</td>
                <td>${name}</td>
                <td>${gender}</td>
                <td>${formatDate(birthday)}</td> <!-- Форматуємо дату -->
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
        } else {
            // Якщо поля не заповнені, показуємо алерт
            studentForm.reset();
            addStudentForm.classList.add("hidden");
        }
    });

    // Кнопка "Add Student" з валідацією
    addStudentButton.addEventListener("click", function () {
        const group = document.getElementById("group").value;
        const name = document.getElementById("name").value;
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;
        if (group && name && gender && birthday) {
            // Створення нового рядка таблиці
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${group}</td>
                <td>${name}</td>
                <td>${gender}</td>
                <td>${formatDate(birthday)}</td> <!-- Форматуємо дату -->
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
        }
        else{
            alert("Please fill all fields before adding a student.");
            addStudentForm.classList.remove("hidden");
        }
        // Перевірка, чи всі поля заповнені
        // if (!group || !name || !gender || !birthday) {
        //     alert("Please fill all fields before adding a student.");
        // } else {
        //     addStudentForm.classList.remove("hidden");
        // }
    });
});

