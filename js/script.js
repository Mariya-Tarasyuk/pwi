/* eslint-env browser */
document.addEventListener("DOMContentLoaded", function () {
    // Елементи DOM
    const elements = {
        mainCheckbox: document.querySelector("th input[type=\"checkbox\"]"),
        tableBody: document.querySelector("#studentsTable tbody"),
        addStudentBtn: document.querySelector(".add-student-btn"),
        addStudentForm: document.getElementById("addStudentForm"),
        editStudentForm: document.getElementById("editStudentForm"),
        deleteConfirmation: document.getElementById("deleteConfirmation"),
        addStudentFormElement: document.getElementById("addStudentFormElement"),
        editStudentFormElement: document.getElementById("editStudentFormElement"),
        studentName: document.getElementById("studentName"),
        bellIcon: document.querySelector(".notification-bell"),
        notificationDropdown: document.querySelector(".notification-dropdown"),
        indicator: document.querySelector(".notification-indicator"),
        profileContainer: document.querySelector(".profile-container"),
        dropdownMenu: document.querySelector(".dropdown-menu"),
        logoutButton: document.getElementById("logout"),
    };

    // Ініціалізація даних
    let students = [
        { group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
        { group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
        { group: "KN-22", name: "Mark Spencer", gender: "M", birthday: "19.02.2002", status: "Active" },
        { group: "KN-21", name: "Emily Johnson", gender: "F", birthday: "15.01.2001", status: "Active" },
        { group: "KN-23", name: "Alice Brown", gender: "F", birthday: "25.12.2000", status: "Inactive" },
        { group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
        { group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
        { group: "KN-22", name: "Mark Spencer", gender: "M", birthday: "19.02.2002", status: "Active" },
        { group: "KN-21", name: "Emily Johnson", gender: "F", birthday: "15.01.2001", status: "Active" },
        { group: "KN-23", name: "Alice Brown", gender: "F", birthday: "25.12.2000", status: "Inactive" },
        { group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
        { group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
    ];

    const studentsPerPage = 10;
    let currentPage = 1;
    let studentToDelete = null;
    let editingStudentRow = null;

    // Функція для заповнення випадаючого меню групами
    function populateGroupDropdown() {
        const groups = [...new Set(students.map((student) => student.group))];
        const addGroupSelect = elements.addStudentForm.querySelector("#addGroup");
        const editGroupSelect = elements.editStudentForm.querySelector("#editGroup");

        addGroupSelect.innerHTML = "<option value=\"\" disabled selected>Select a group</option>";
        groups.forEach((group) => {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            addGroupSelect.appendChild(option);
        });

        editGroupSelect.innerHTML = "<option value=\"\" disabled selected>Select a group</option>";
        groups.forEach((group) => {
            const option = document.createElement("option");
            option.value = group;
            option.textContent = group;
            editGroupSelect.appendChild(option);
        });
    }

    // Утиліти
    const formatDate = (date) => {
        const d = new Date(date);
        return String(d.getDate()).padStart(2, "0") + "." +
               String(d.getMonth() + 1).padStart(2, "0") + "." +
               d.getFullYear();
    };

    // Рендеринг таблиці
    function renderTable() {
        elements.tableBody.innerHTML = "";
        const start = (currentPage - 1) * studentsPerPage;
        const end = Math.min(start + studentsPerPage, students.length);

        students.slice(start, end).forEach((student, index) => {
            const row = document.createElement("tr");
            const initials = student.name.split(" ").map((n) => n[0] + ".").join(" ");
            row.innerHTML = [
                "<td><input type=\"checkbox\" aria-label=\"select student\" data-index=\"" + (start + index) + "\"></td>",
                "<td data-label=\"Group\">" + student.group + "</td>",
                "<td data-label=\"Name\" data-initials=\"" + initials + "\">" + student.name + "</td>",
                "<td data-label=\"Gender\">" + student.gender + "</td>",
                "<td data-label=\"Birthday\">" + student.birthday + "</td>",
                "<td data-label=\"Status\">",
                "<i class=\"fa-solid fa-circle\" style=\"color: " + (student.status === "Active" ? "green" : "gray") + ";\"></i>",
                "</td>",
                "<td data-label=\"Options\">",
                "<i class=\"fa-solid fa-pen\" data-index=\"" + (start + index) + "\"></i>",
                "<i class=\"fa-solid fa-xmark\" data-index=\"" + (start + index) + "\"></i>",
                "</td>",
            ].join("");
            elements.tableBody.appendChild(row);
        });
        updatePagination();
        updateCheckboxListeners();
        populateGroupDropdown();
    }

    // Оновлення пагінації
    function updatePagination() {
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === Math.ceil(students.length / studentsPerPage);
    }

    // Обробка чекбоксів
    function updateCheckboxListeners() {
        const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
        const editIcons = document.querySelectorAll(".fa-pen");
        const deleteIcons = document.querySelectorAll(".fa-xmark");

        elements.mainCheckbox.addEventListener("change", function () {
            const isChecked = elements.mainCheckbox.checked;
            studentCheckboxes.forEach(function (cb) {
                cb.checked = isChecked;
            });

            editIcons.forEach(function (icon) {
                icon.style.pointerEvents = isChecked ? "none" : "auto";
                icon.style.opacity = isChecked ? "0.5" : "1";
            });
        });

        studentCheckboxes.forEach(function (cb) {
            cb.addEventListener("change", function () {
                const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
                const checkedCount = checkedBoxes.length;

                elements.mainCheckbox.checked = checkedCount === studentCheckboxes.length;

                if (checkedCount === 1) {
                    editIcons.forEach(function (icon) {
                        icon.style.pointerEvents = "auto";
                        icon.style.opacity = "1";
                    });
                } else {
                    editIcons.forEach(function (icon) {
                        icon.style.pointerEvents = "none";
                        icon.style.opacity = "0.5";
                    });
                }
            });
        });

        editIcons.forEach(function (icon) {
            icon.addEventListener("click", function () {
                const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
                if (checkedBoxes.length === 1) {
                    const index = parseInt(checkedBoxes[0].dataset.index, 10);
                    editingStudentRow = index;
                    const student = students[index];
                    const editGroupSelect = elements.editStudentForm.querySelector("#editGroup");
                    editGroupSelect.value = student.group;
                    elements.editStudentForm.querySelector("#editName").value = student.name;
                    elements.editStudentForm.querySelector("#editGender").value = student.gender;
                    elements.editStudentForm.querySelector("#editBirthday").value = student.birthday.split(".").reverse().join("-");
                    elements.editStudentForm.classList.remove("hidden");
                }
            });
        });

        deleteIcons.forEach(function (icon) {
            icon.addEventListener("click", function (e) {
                const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
                if (checkedBoxes.length === 0) {
                    studentToDelete = parseInt(e.target.dataset.index, 10);
                    elements.studentName.textContent = students[studentToDelete].name;
                    elements.deleteConfirmation.classList.remove("hidden");
                } else if (elements.mainCheckbox.checked) {
                    elements.studentName.textContent = "all students";
                    elements.deleteConfirmation.classList.remove("hidden");
                } else {
                    elements.studentName.textContent = checkedBoxes.length + " students";
                    elements.deleteConfirmation.classList.remove("hidden");
                }
            });
        });
    }

    // Додавання студента
    function addStudent(e) {
        e.preventDefault();
        const form = e.target;
        const isAddForm = form.id === "addStudentFormElement";
        const groupId = isAddForm ? "addGroup" : "editGroup";
        const nameId = isAddForm ? "addName" : "editName";
        const genderId = isAddForm ? "addGender" : "editGender";
        const birthdayId = isAddForm ? "addBirthday" : "editBirthday";

        const studentData = {
            group: form.querySelector("#" + groupId).value,
            name: form.querySelector("#" + nameId).value,
            gender: form.querySelector("#" + genderId).value,
            birthday: formatDate(form.querySelector("#" + birthdayId).value),
            status: "Active",
        };

        if (Object.values(studentData).every(function (val) { return val; })) {
            if (editingStudentRow !== null) {
                students[editingStudentRow] = studentData;
                editingStudentRow = null;
            } else {
                students.push(studentData);
            }
            form.reset();
            elements.addStudentForm.classList.add("hidden");
            elements.editStudentForm.classList.add("hidden");
            renderTable();
        } else {
            alert("Please fill all fields");
        }
    }

    // Події для кнопки "Add Student"
    elements.addStudentBtn.addEventListener("click", function () {
        if (!elements.deleteConfirmation.classList.contains("hidden")) {
            return;
        }
        elements.addStudentForm.classList.remove("hidden");
        elements.addStudentFormElement.reset();
        editingStudentRow = null;
        elements.mainCheckbox.checked = false;
        const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
        studentCheckboxes.forEach(function (cb) {
            cb.checked = false;
        });
    });

    // Видалення студента(ів)
    document.getElementById("confirmDeleteBtn").addEventListener("click", function () {
        const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
        if (elements.mainCheckbox.checked) {
            students = [];
            currentPage = 1;
        } else if (checkedBoxes.length > 0) {
            const indicesToDelete = Array.from(checkedBoxes)
                .map(function (cb) { return parseInt(cb.dataset.index, 10); })
                .sort(function (a, b) { return b - a; });

            indicesToDelete.forEach(function (index) {
                students.splice(index, 1);
            });

            const maxPage = Math.ceil(students.length / studentsPerPage);
            if (currentPage > maxPage && maxPage > 0) {
                currentPage = maxPage;
            } else if (students.length === 0) {
                currentPage = 1;
            }
        } else if (studentToDelete !== null) {
            students.splice(studentToDelete, 1);
            studentToDelete = null;

            const maxPage = Math.ceil(students.length / studentsPerPage);
            if (currentPage > maxPage && maxPage > 0) {
                currentPage = maxPage;
            } else if (students.length === 0) {
                currentPage = 1;
            }
        }
        elements.deleteConfirmation.classList.add("hidden");
        renderTable();
    });

    // Закриття модального вікна через хрестик
    document.querySelectorAll(".fa-xmark.closeIcon").forEach(function (icon) {
        icon.addEventListener("click", function () {
            icon.closest("div").classList.add("hidden");
            studentToDelete = null;
            elements.mainCheckbox.checked = false;
            const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
            studentCheckboxes.forEach(function (cb) {
                cb.checked = false;
            });
        });
    });

    document.getElementById("cancelDeleteBtn").addEventListener("click", function () {
        elements.deleteConfirmation.classList.add("hidden");
        studentToDelete = null;
        elements.mainCheckbox.checked = false;
        const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
        studentCheckboxes.forEach(function (cb) {
            cb.checked = false;
        });
    });

    elements.addStudentFormElement.addEventListener("submit", addStudent);
    elements.editStudentFormElement.addEventListener("submit", addStudent);

    document.querySelectorAll("#addOkBtn, #editOkBtn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            btn.closest("div").classList.add("hidden");
            const form = btn.closest("form");
            if (form) form.reset();
        });
    });

    // Пагінація
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

    // Повідомлення
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
        setTimeout(function () { elements.bellIcon.classList.remove("bell-animation"); }, 500);
    });

    // Профіль
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
        alert("You logouted!");
    });

    // Ініціалізація
    renderTable();
});
