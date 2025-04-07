/* eslint-env browser */

// Змінні, доступні в глобальному скоупі
let students = [];
const studentsPerPage = 10;
let currentPage = 1;
let studentToDelete = null;
let editingStudentRow = null;

// Елементи DOM
const elements = {
    mainCheckbox: null,
    tableBody: null,
    addStudentBtn: null,
    addStudentForm: null,
    addStudentFormElement: null,
    deleteConfirmation: null,
    studentName: null,
    bellIcon: null,
    notificationDropdown: null,
    indicator: null,
    profileContainer: null,
    dropdownMenu: null,
    logoutButton: null,
    formTitle: null,
    submitBtn: null,
};

// Функція для збереження даних у localStorage
function saveStudents() {
    console.log("Saving students to localStorage:", students);
    localStorage.setItem("students", JSON.stringify(students));
}

// Функція для оновлення кешу
function updateCache() {
    console.log("Updating cache with students:", students);
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const message = {
            type: "UPDATE_CACHE",
            data: students
        };
        navigator.serviceWorker.controller.postMessage(message);
    }
}

// Функція для завантаження даних із кешу або localStorage
async function loadStudents() {
    console.log("Starting loadStudents...");
    console.log("Is saveStudents defined?", typeof saveStudents === "function");
    try {
        const response = await fetch("/api/students");
        const contentType = response.headers.get("content-type");
        if (response.ok && contentType && contentType.includes("application/json")) {
            const cachedStudents = await response.json();
            if (cachedStudents && cachedStudents.length > 0) {
                students = cachedStudents;
                if (typeof saveStudents === "function") {
                    saveStudents();
                } else {
                    console.error("saveStudents is not defined in loadStudents!");
                }
                return;
            }
        } else {
            console.warn("Received non-JSON response from /api/students, falling back to localStorage");
        }
    } catch (error) {
        console.warn("Failed to load students from cache:", error);
    }

    students = JSON.parse(localStorage.getItem("students")) || [
        { id: 1, group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
        { id: 2, group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
        { id: 3, group: "KN-22", name: "Mark Spencer", gender: "M", birthday: "19.02.2002", status: "Active" },
    ];

    if (typeof updateCache === "function") {
        updateCache();
    } else {
        console.error("updateCache is not defined in loadStudents!");
    }
}

// Форматування дати для відображення (DD.MM.YYYY)
const formatDate = (date) => {
    const d = new Date(date);
    return String(d.getDate()).padStart(2, "0") + "." +
           String(d.getMonth() + 1).padStart(2, "0") + "." +
           d.getFullYear();
};

// Конвертація дати з DD.MM.YYYY у YYYY-MM-DD для <input type="date">
const convertToInputDateFormat = (dateStr) => {
    const [day, month, year] = dateStr.split(".");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

// Валідація форми
function validateForm(form) {
    const firstName = form.querySelector("#addFirstName").value;
    const lastName = form.querySelector("#addLastName").value;
    const birthday = form.querySelector("#addBirthday").value;

    const nameRegex = /^[A-Za-zА-Яа-я]{2,}$/;
    const altNameRegex = /^[A-Za-zА-Яа-я\s-]{2,}$/;
    const useAltValidation = true;
    const regexToUse = useAltValidation ? altNameRegex : nameRegex;

    let isValid = true;

    if (!regexToUse.test(firstName)) {
        form.querySelector("#addFirstName").classList.add("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
        form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Invalid first name</span>");
        isValid = false;
    } else {
        form.querySelector("#addFirstName").classList.remove("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
    }

    if (!regexToUse.test(lastName)) {
        form.querySelector("#addLastName").classList.add("error");
        form.querySelector("#addLastName").nextElementSibling?.remove();
        form.querySelector("#addLastName").insertAdjacentHTML("afterend", "<span class='error-msg'>Invalid last name</span>");
        isValid = false;
    } else {
        form.querySelector("#addLastName").classList.remove("error");
        form.querySelector("#addLastName").nextElementSibling?.remove();
    }

    const today = new Date();
    const birthDate = new Date(birthday);
    if (!birthday || birthDate >= today) {
        form.querySelector("#addBirthday").classList.add("error");
        form.querySelector("#addBirthday").nextElementSibling?.remove();
        form.querySelector("#addBirthday").insertAdjacentHTML("afterend", "<span class='error-msg'>Date must be in the past</span>");
        isValid = false;
    } else {
        form.querySelector("#addBirthday").classList.remove("error");
        form.querySelector("#addBirthday").nextElementSibling?.remove();
    }

    return isValid;
}

// Додавання або редагування студента
function addStudent(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
        console.log("Form validation failed");
        return;
    }

    const firstName = form.querySelector("#addFirstName").value;
    const lastName = form.querySelector("#addLastName").value;
    const studentData = {
        id: form.querySelector("#studentId").value || Date.now(),
        group: form.querySelector("#addGroup").value,
        name: `${firstName} ${lastName}`,
        gender: form.querySelector("#addGender").value,
        birthday: formatDate(form.querySelector("#addBirthday").value),
        status: "Active",
    };

    console.log("Adding/Editing student:", studentData);

    if (Object.values(studentData).every(val => val)) {
        if (editingStudentRow !== null) {
            console.log("Editing student at index:", editingStudentRow);
            students[editingStudentRow] = studentData;
            editingStudentRow = null;
        } else {
            console.log("Adding new student");
            students.push(studentData);
        }
        if (typeof saveStudents === "function") {
            saveStudents();
        } else {
            console.error("saveStudents is not defined in addStudent!");
        }
        if (typeof updateCache === "function") {
            updateCache();
        } else {
            console.error("updateCache is not defined in addStudent!");
        }
        form.reset();
        elements.addStudentForm.classList.add("hidden");
        document.body.classList.remove("modal-open");
        renderTable();
    } else {
        console.log("Some fields are empty or invalid:", studentData);
    }
}

// Рендеринг таблиці
function renderTable() {
    elements.tableBody.innerHTML = "";
    const start = (currentPage - 1) * studentsPerPage;
    const end = Math.min(start + studentsPerPage, students.length);

    students.slice(start, end).forEach((student, index) => {
        const globalIndex = start + index;
        const row = document.createElement("tr");
        const initials = student.name.split(" ").map(n => n[0] + ".").join(" ");
        row.innerHTML = [
            "<td><input type=\"checkbox\" aria-label=\"select student\" data-index=\"" + globalIndex + "\"></td>",
            "<td data-label=\"Group\">" + student.group + "</td>",
            "<td data-label=\"Name\" data-initials=\"" + initials + "\">" + student.name + "</td>",
            "<td data-label=\"Gender\">" + student.gender + "</td>",
            "<td data-label=\"Birthday\">" + student.birthday + "</td>",
            "<td data-label=\"Status\"><i class=\"fa-solid fa-circle\" style=\"color: " + (student.status === "Active" ? "green" : "gray") + ";\"></i></td>",
            "<td data-label=\"Options\">",
            "<i class=\"fa-solid fa-pen\" data-index=\"" + globalIndex + "\"></i>",
            "<i class=\"fa-solid fa-xmark\" data-index=\"" + globalIndex + "\"></i>",
            "</td>",
        ].join("");
        elements.tableBody.appendChild(row);
    });
    updatePagination();
    updateCheckboxListeners();
}

// Оновлення пагінації
function updatePagination() {
    document.getElementById("prev-page").disabled = currentPage === 1;
    document.getElementById("next-page").disabled = currentPage === Math.ceil(students.length / studentsPerPage) || students.length === 0;
}

// Оновлення слухачів подій для чекбоксів і іконок
function updateCheckboxListeners() {
    const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
    const editIcons = document.querySelectorAll(".fa-pen");
    const deleteIcons = document.querySelectorAll(".fa-xmark");

    elements.mainCheckbox.removeEventListener("change", handleMainCheckboxChange);
    elements.mainCheckbox.addEventListener("change", handleMainCheckboxChange);

    function handleMainCheckboxChange() {
        const isChecked = elements.mainCheckbox.checked;
        studentCheckboxes.forEach(cb => cb.checked = isChecked);
        editIcons.forEach(icon => {
            icon.style.pointerEvents = isChecked ? "none" : "auto";
            icon.style.opacity = isChecked ? "0.5" : "1";
        });
    }

    studentCheckboxes.forEach(cb => {
        cb.removeEventListener("change", handleCheckboxChange);
        cb.addEventListener("change", handleCheckboxChange);
    });

    function handleCheckboxChange() {
        const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
        elements.mainCheckbox.checked = checkedBoxes.length === studentCheckboxes.length;
        editIcons.forEach(icon => {
            icon.style.pointerEvents = checkedBoxes.length === 1 ? "auto" : "none";
            icon.style.opacity = checkedBoxes.length === 1 ? "1" : "0.5";
        });
    }

    editIcons.forEach(icon => {
        icon.removeEventListener("click", handleEditIconClick);
        icon.addEventListener("click", handleEditIconClick);
    });

    function handleEditIconClick() {
        const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
        if (checkedBoxes.length === 1) {
            const index = parseInt(checkedBoxes[0].dataset.index, 10);
            editingStudentRow = index;
            const student = students[index];
            const [firstName, lastName] = student.name.split(" ");
            elements.formTitle.textContent = "Edit Student";
            elements.submitBtn.textContent = "Save Changes";
            elements.addStudentForm.querySelector("#studentId").value = student.id;
            elements.addStudentForm.querySelector("#addGroup").value = student.group;
            elements.addStudentForm.querySelector("#addFirstName").value = firstName;
            elements.addStudentForm.querySelector("#addLastName").value = lastName || "";
            elements.addStudentForm.querySelector("#addGender").value = student.gender;
            elements.addStudentForm.querySelector("#addBirthday").value = convertToInputDateFormat(student.birthday);
            elements.addStudentForm.classList.remove("hidden");
            document.body.classList.add("modal-open");
        }
    }

    deleteIcons.forEach(icon => {
        icon.removeEventListener("click", handleDeleteIconClick);
        icon.addEventListener("click", handleDeleteIconClick);
    });

    function handleDeleteIconClick(e) {
        if (!elements.deleteConfirmation.classList.contains("hidden")) {
            return;
        }

        const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
        if (checkedBoxes.length === 0) {
            studentToDelete = parseInt(e.target.dataset.index, 10);
            elements.studentName.textContent = students[studentToDelete].name;
            elements.deleteConfirmation.classList.remove("hidden");
        } else if (elements.mainCheckbox.checked) {
            elements.studentName.textContent = "all students";
            elements.deleteConfirmation.classList.remove("hidden");
        } else if (checkedBoxes.length > 0) {
            elements.studentName.textContent = checkedBoxes.length + " students";
            elements.deleteConfirmation.classList.remove("hidden");
        }
    }
}

// Ініціалізація елементів DOM після завантаження сторінки
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOMContentLoaded triggered");

    // Ініціалізація елементів DOM
    elements.mainCheckbox = document.querySelector("th input[type=\"checkbox\"]");
    elements.tableBody = document.querySelector("#studentsTable tbody");
    elements.addStudentBtn = document.querySelector(".add-student-btn");
    elements.addStudentForm = document.getElementById("addStudentForm");
    elements.addStudentFormElement = document.getElementById("addStudentFormElement");
    elements.deleteConfirmation = document.getElementById("deleteConfirmation");
    elements.studentName = document.getElementById("studentName");
    elements.bellIcon = document.querySelector(".notification-bell");
    elements.notificationDropdown = document.querySelector(".notification-dropdown");
    elements.indicator = document.querySelector(".notification-indicator");
    elements.profileContainer = document.querySelector(".profile-container");
    elements.dropdownMenu = document.querySelector(".dropdown-menu");
    elements.logoutButton = document.getElementById("logout");
    elements.formTitle = document.getElementById("formTitle");
    elements.submitBtn = document.getElementById("submitBtn");

    // Ініціалізація: завантажуємо студентів і рендеримо таблицю
    await loadStudents();
    renderTable();

    // Слухачі подій
    elements.addStudentBtn.addEventListener("click", function () {
        elements.formTitle.textContent = "Add New Student";
        elements.submitBtn.textContent = "Add Student";
        elements.addStudentFormElement.reset();
        elements.addStudentForm.querySelector("#studentId").value = "";
        elements.addStudentForm.classList.remove("hidden");
        document.body.classList.add("modal-open");
        editingStudentRow = null;
    });

    document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
        const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
        if (elements.mainCheckbox.checked) {
            students = [];
            currentPage = 1;
        } else if (checkedBoxes.length > 0) {
            const indicesToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.index, 10)).sort((a, b) => b - a);
            indicesToDelete.forEach(index => students.splice(index, 1));
            currentPage = Math.min(currentPage, Math.ceil(students.length / studentsPerPage) || 1);
        } else if (studentToDelete !== null) {
            students.splice(studentToDelete, 1);
            studentToDelete = null;
            currentPage = Math.min(currentPage, Math.ceil(students.length / studentsPerPage) || 1);
        }
        elements.deleteConfirmation.classList.add("hidden");
        saveStudents();
        updateCache();
        renderTable();
    });

    document.querySelectorAll(".fa-xmark.closeIcon").forEach(icon => {
        icon.addEventListener("click", function () {
            const modal = icon.closest("div");
            modal.classList.add("hidden");
            document.body.classList.remove("modal-open");
            studentToDelete = null;
            elements.mainCheckbox.checked = false;
            document.querySelectorAll("td input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
            if (modal === elements.addStudentForm) {
                elements.addStudentFormElement.reset();
            }
        });
    });

    document.getElementById("cancelDeleteBtn").addEventListener("click", function () {
        elements.deleteConfirmation.classList.add("hidden");
        studentToDelete = null;
    });

    elements.addStudentFormElement.addEventListener("submit", addStudent);

    document.getElementById("addOkBtn").addEventListener("click", function () {
        elements.addStudentForm.classList.add("hidden");
        document.body.classList.remove("modal-open");
        elements.addStudentFormElement.reset();
    });

    document.getElementById("prev-page").addEventListener("click", function () {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("next-page").addEventListener("click", function () {
        if (currentPage < Math.ceil(students.length / studentsPerPage)) {
            currentPage++;
            renderTable();
        }
    });

    elements.bellIcon.addEventListener("click", function () {
        elements.notificationDropdown.classList.toggle("show");
        elements.indicator.classList.remove("show");
    });

    document.addEventListener("click", function (e) {
        if (!elements.bellIcon.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove("show");
        }
    });

    elements.bellIcon.addEventListener("dblclick", function () {
        elements.indicator.classList.toggle("show");
        elements.notificationDropdown.classList.toggle("show");
        elements.bellIcon.classList.add("bell-animation");
        setTimeout(() => elements.bellIcon.classList.remove("bell-animation"), 500);
    });

    elements.profileContainer.addEventListener("click", function (e) {
        e.stopPropagation();
        elements.dropdownMenu.style.display = elements.dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function (e) {
        if (!elements.profileContainer.contains(e.target)) {
            elements.dropdownMenu.style.display = "none";
        }
    });

    elements.logoutButton.addEventListener("click", function () {
        alert("You logged out!");
    });

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("/sw.js").then(
                registration => console.log("Service Worker registered:", registration),
                error => console.log("Service Worker registration failed:", error)
            );
        });
    }
});