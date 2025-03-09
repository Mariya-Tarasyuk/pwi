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

    const deleteConfirmation = document.getElementById("deleteConfirmation");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const studentNameElement = document.getElementById("studentName");

    let studentToDelete = null; // змінна для збереження студента, якого потрібно видалити

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

    table.addEventListener("click", function (event) {
        if (event.target.classList.contains("fa-xmark")) {
            const row = event.target.closest("tr");
            const name = row.querySelector("td:nth-child(3)").textContent;
            studentNameElement.textContent = name;

            // Зберігаємо студент, якого потрібно видалити
            studentToDelete = row;

            // Показуємо модальне вікно
            deleteConfirmation.classList.remove("hidden");
        }
    });

    // Закрити модальне вікно без видалення
    cancelDeleteBtn.addEventListener("click", function () {
        deleteConfirmation.classList.add("hidden");
    });

    // Підтвердити видалення
    confirmDeleteBtn.addEventListener("click", function () {
        if (studentToDelete) {
            studentToDelete.remove(); // Видаляємо рядок з таблиці
            studentToDelete = null; // Очищаємо змінну
        }
        deleteConfirmation.classList.add("hidden"); // Закриваємо модальне вікно
    });

    // Закрити модальне вікно без підтвердження
    closeDeleteBtn.addEventListener("click", function () {
        deleteConfirmation.classList.add("hidden");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const bellIcon = document.querySelector(".notification-bell");
    const dropdown = document.querySelector(".notification-dropdown");
    const indicator = document.querySelector(".notification-indicator");
    
    bellIcon.addEventListener("dblclick", function () {
        indicator.classList.toggle("show");
        dropdown.classList.toggle("show");
        bellIcon.classList.add("bell-animation");
        setTimeout(() => bellIcon.classList.remove("bell-animation"), 500);
    });
   
    if (bellIcon && dropdown) {
        bellIcon.addEventListener("click", function () {
            indicator.classList.remove("show");
            dropdown.classList.toggle("show");
        });

        // Закриває меню при кліку поза ним
        document.addEventListener("click", function (event) {
            if (!bellIcon.contains(event.target) && !dropdown.contains(event.target)) {
                dropdown.classList.remove("show");
            }
        });
    }
    
});
// Отримуємо елементи
const profileContainer = document.querySelector('.profile-container');
const dropdownMenu = document.querySelector('.dropdown-menu');
const logoutButton = document.getElementById('logout');

// Функція для показу/приховування меню
function toggleDropdown() {
  // Перевірка, чи меню вже відкрите
  if (dropdownMenu.style.display === 'block') {
    dropdownMenu.style.display = 'none';  // Якщо відкрите - ховаємо
  } else {
    dropdownMenu.style.display = 'block';  // Якщо приховане - показуємо
  }
}

// Додаємо обробник події на клік по контейнеру
profileContainer.addEventListener('click', (event) => {
  event.stopPropagation();  // Запобігаємо спливу події
  toggleDropdown();  // Викликаємо функцію для перемикання меню
});

// Закриваємо меню, якщо користувач натискає поза контейнером
document.addEventListener('click', (event) => {
  if (!profileContainer.contains(event.target)) {
    dropdownMenu.style.display = 'none';  // Ховаємо меню
  }
});

// Логіка виходу з аккаунту
logoutButton.addEventListener('click', () => {
  alert('Ви вийшли з аккаунту!');
  // Тут можна додати реальну логіку для виходу з аккаунту, наприклад:
  // window.location.href = '/logout';  // Направити на сторінку для виходу
});

// document.addEventListener("DOMContentLoaded", function () {
//    const prfpctr = document.querySelector("profile-avatar");
//    const menu = document.querySelector("dropdown-menu");

   
// });