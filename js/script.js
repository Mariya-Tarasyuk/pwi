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

    const editStudentBtn = document.querySelector(".fa-pen");
    const editStudentForm = document.getElementById("editStudentForm");
    let studentToDelete = null; // змінна для збереження студента, якого потрібно видалити

    // Показати форму для додавання студента
    addStudentBtn.addEventListener("click", function () {
        addStudentForm.classList.remove("hidden");
    });

    editStudentBtn.addEventListener("click", function () {
        editStudentForm.classList.remove("hidden");
    });

    // Сховати форму при натисканні на хрестик

    document.querySelectorAll(".closeIcon").forEach(icon => {
        icon.addEventListener("click", function () {
            this.closest("div").classList.add("hidden");
        });
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
// Приклад масиву студентів
const students = [
    { group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
    { group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
    { group: "KN-22", name: "Mark Spencer", gender: "M", birthday: "19.02.2002", status: "Active" },
    { group: "KN-21", name: "Emily Johnson", gender: "F", birthday: "15.01.2001", status: "Active" },
    { group: "KN-23", name: "Alice Brown", gender: "F", birthday: "25.12.2000", status: "Inactive" },
    { group: "KN-21", name: "Michael White", gender: "M", birthday: "03.03.2005", status: "Active" },
    { group: "KN-22", name: "Sophia Lee", gender: "F", birthday: "17.07.2003", status: "Active" },
    { group: "KN-21", name: "David Clark", gender: "M", birthday: "09.09.2002", status: "Inactive" },
    { group: "KN-23", name: "Lucas Scott", gender: "M", birthday: "14.11.2004", status: "Active" },
    { group: "KN-22", name: "Charlotte Allen", gender: "F", birthday: "21.08.2001", status: "Inactive" },
    { group: "KN-21", name: "Oliver Harris", gender: "M", birthday: "13.03.2003", status: "Active" },
    { group: "KN-21", name: "Mason Carter", gender: "M", birthday: "27.05.2004", status: "Inactive" },
    { group: "KN-23", name: "Ava Mitchell", gender: "F", birthday: "16.01.2002", status: "Active" },
    // Додаємо більше студентів за необхідності
];

let currentPage = 1;
const studentsPerPage = 10;

// Функція для відображення студентів на поточній сторінці
function displayStudents() {
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const studentsToDisplay = students.slice(startIndex, endIndex);

    const table = document.getElementById("studentsTable");
    // Очищаємо таблицю перед додаванням нових рядків
    table.innerHTML = `
        <tr>
            <th><input type="checkbox"></th>
            <th>Group</th>
            <th>Name</th>
            <th>Gender</th>
            <th>Birthday</th>
            <th>Status</th>
            <th>Options</th>
        </tr>`;

    // Додаємо нові рядки до таблиці
    studentsToDisplay.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox"></td>
            <td>${student.group}</td>
            <td>${student.name}</td>
            <td>${student.gender}</td>
            <td>${student.birthday}</td>
            <td><i class="fa-solid fa-circle"></i></td>
            <td><i class="fa-solid fa-pen"></i> <i class="fa-solid fa-xmark"></i></td>
        `;
        table.appendChild(row);
    });

    // Оновлюємо номер сторінки
    document.getElementById("pageNumber").textContent = `Page ${currentPage}`;
}

// Функція для зміни сторінки
function changePage(direction) {
    const totalPages = Math.ceil(students.length / studentsPerPage);

    currentPage += direction;

    // Перевіряємо, щоб сторінка не виходила за межі
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    displayStudents();
}

// Показуємо студентів на першій сторінці
displayStudents();
