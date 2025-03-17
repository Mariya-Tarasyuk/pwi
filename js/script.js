document.addEventListener("DOMContentLoaded", function () {
    // Елементи DOM
    const elements = {
        mainCheckbox: document.querySelector("th input[type='checkbox']"),
        tableBody: document.querySelector("#studentsTable tbody"),
        addStudentBtn: document.querySelector(".add-student-btn"),
        addStudentForm: document.getElementById("addStudentForm"),
        editStudentForm: document.getElementById("editStudentForm"),
        deleteConfirmation: document.getElementById("deleteConfirmation"),
        studentForm: document.getElementById("studentForm"),
        studentName: document.getElementById("studentName"),
        bellIcon: document.querySelector(".notification-bell"),
        notificationDropdown: document.querySelector(".notification-dropdown"),
        indicator: document.querySelector(".notification-indicator"),
        profileContainer: document.querySelector('.profile-container'),
        dropdownMenu: document.querySelector('.dropdown-menu'),
        logoutButton: document.getElementById('logout')
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
        { group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" }
    ];
    
    const studentsPerPage = 10;
    let currentPage = 1;
    let studentToDelete = null;
    let editingStudentRow = null;

    // Утиліти
    const formatDate = date => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    };

    // Рендеринг таблиці
    function renderTable() {
        elements.tableBody.innerHTML = "";
        const start = (currentPage - 1) * studentsPerPage;
        const end = Math.min(start + studentsPerPage, students.length);
        
        students.slice(start, end).forEach((student, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td>${student.group}</td>
                <td>${student.name}</td>
                <td>${student.gender}</td>
                <td>${student.birthday}</td>
                <td><i class="fa-solid fa-circle" style="color: ${student.status === "Active" ? "green" : "gray"};"></i></td>
                <td>
                    <i class="fa-solid fa-pen" data-index="${start + index}"></i>
                    <i class="fa-solid fa-xmark" data-index="${start + index}"></i>
                </td>
            `;
            elements.tableBody.appendChild(row);
        });
        updatePagination();
        updateCheckboxListeners();
    }
    
    // Оновлення пагінації
    function updatePagination() {
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === Math.ceil(students.length / studentsPerPage);
    }
    
    function renderTable() {
        elements.tableBody.innerHTML = "";
        const start = (currentPage - 1) * studentsPerPage;
        const end = Math.min(start + studentsPerPage, students.length);

        students.slice(start, end).forEach((student, index) => {
            const row = document.createElement("tr");
            const initials = student.name.split(" ").map(n => n[0] + ".").join(" ");
            row.innerHTML = `
                <td><input type="checkbox"></td>
                <td data-label="Group">${student.group}</td>
                <td data-label="Name" data-initials="${initials}">${student.name}</td>
                <td data-label="Gender">${student.gender}</td>
                <td data-label="Birthday">${student.birthday}</td>
                <td data-label="Status"><i class="fa-solid fa-circle" style="color: ${student.status === "Active" ? "green" : "gray"};"></i></td>
                <td data-label="Options">
                    <i class="fa-solid fa-pen" data-index="${start + index}"></i>
                    <i class="fa-solid fa-xmark" data-index="${start + index}"></i>
                </td>
            `;
            elements.tableBody.appendChild(row);
        });
        updatePagination();
        updateCheckboxListeners();
    }
    // Обробка чекбоксів
    function updateCheckboxListeners() {
        const studentCheckboxes = document.querySelectorAll("td input[type='checkbox']");
        elements.mainCheckbox.addEventListener("change", () => {
            studentCheckboxes.forEach(cb => cb.checked = elements.mainCheckbox.checked);
        });
        
        studentCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                elements.mainCheckbox.checked = [...studentCheckboxes].every(cb => cb.checked);
            });
        });
    }

    // Додавання студента
    function addStudent(e) {
        e.preventDefault();
        const studentData = {
            group: document.getElementById("group").value,
            name: document.getElementById("name").value,
            gender: document.getElementById("gender").value,
            birthday: formatDate(document.getElementById("birthday").value),
            status: "Active"
        };

        if (Object.values(studentData).every(val => val)) {
            if (editingStudentRow !== null) {
                students[editingStudentRow] = studentData;
                editingStudentRow = null;
            } else {
                students.push(studentData);
            }
            elements.studentForm.reset();
            elements.addStudentForm.classList.add("hidden");
            elements.editStudentForm.classList.add("hidden");
            renderTable();
        } else {
            alert("Please fill all fields");
        }
    }

    // Події
    elements.addStudentBtn.addEventListener("click", () => {
        elements.addStudentForm.classList.remove("hidden");
        elements.studentForm.reset();
        editingStudentRow = null;
    });

    elements.tableBody.addEventListener("click", e => {
        const index = e.target.dataset.index;
        if (e.target.classList.contains("fa-pen") && index) {
            editingStudentRow = parseInt(index);
            const student = students[editingStudentRow];
            elements.editStudentForm.querySelector("#group").value = student.group;
            elements.editStudentForm.querySelector("#name").value = student.name;
            elements.editStudentForm.querySelector("#gender").value = student.gender;
            elements.editStudentForm.querySelector("#birthday").value = student.birthday.split(".").reverse().join("-");
            elements.editStudentForm.classList.remove("hidden");
        }
        if (e.target.classList.contains("fa-xmark") && index) {
            studentToDelete = parseInt(index);
            elements.studentName.textContent = students[studentToDelete].name;
            elements.deleteConfirmation.classList.remove("hidden");
        }
    });

    // Закриття вікон
    document.querySelectorAll(".fa-xmark.closeIcon").forEach(icon => {
        icon.addEventListener("click", () => {
            icon.closest("div").classList.add("hidden");
        });
    });

    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        elements.deleteConfirmation.classList.add("hidden");
    });

    document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
        if (studentToDelete !== null) {
            students.splice(studentToDelete, 1);
            studentToDelete = null;
            renderTable();
        }
        elements.deleteConfirmation.classList.add("hidden");
    });

    elements.studentForm.addEventListener("submit", addStudent);
    document.querySelectorAll("#okBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.closest("div").classList.add("hidden");
            elements.studentForm.reset();
        });
    });

    // Пагінація
    document.getElementById("prev-page").addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });

    document.getElementById("next-page").addEventListener("click", () => {
        if (currentPage < Math.ceil(students.length / studentsPerPage)) {
            currentPage++;
            renderTable();
        }
    });

    // Повідомлення
    elements.bellIcon.addEventListener("click", () => {
        elements.notificationDropdown.classList.toggle("show");
        elements.indicator.classList.remove("show");
    });

    document.addEventListener("click", e => {
        if (!elements.bellIcon.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove("show");
        }
    });
    // Анімація дзвіночка при подвійному кліку
elements.bellIcon.addEventListener("dblclick", () => {
    elements.indicator.classList.toggle("show");
    elements.notificationDropdown.classList.toggle("show");
    elements.bellIcon.classList.add("bell-animation");
    setTimeout(() => elements.bellIcon.classList.remove("bell-animation"), 500);
});
    // Профіль
    elements.profileContainer.addEventListener("click", e => {
        e.stopPropagation();
        elements.dropdownMenu.style.display = elements.dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", e => {
        if (!elements.profileContainer.contains(e.target)) {
            elements.dropdownMenu.style.display = "none";
        }
    });

    elements.logoutButton.addEventListener("click", () => {
        alert("Ви вийшли з аккаунту!");
    });

    // Ініціалізація
    renderTable();
});