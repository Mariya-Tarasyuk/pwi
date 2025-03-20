document.addEventListener("DOMContentLoaded", function () {
    const elements = {
        mainCheckbox: document.querySelector("#mainCheckbox"),
        tableBody: document.querySelector("#studentsTable tbody"),
        addStudentBtn: document.querySelector(".add-student-btn"),
        addStudentForm: document.getElementById("addStudentForm"),
        editStudentForm: document.getElementById("editStudentForm"),
        deleteConfirmation: document.getElementById("deleteConfirmation"),
        addForm: document.getElementById("addStudentFormContent"),
        editForm: document.getElementById("editStudentFormContent"),
        studentName: document.getElementById("studentName"),
        bellIcon: document.querySelector(".notification-bell"),
        notificationDropdown: document.querySelector(".notification-dropdown"),
        indicator: document.querySelector(".notification-indicator"),
        profileContainer: document.querySelector('.profile-container'),
        dropdownMenu: document.querySelector('.dropdown-menu'),
        logoutButton: document.getElementById('logout'),
        closeAddBtn: document.getElementById('closeAddBtn'),
        closeEditBtn: document.getElementById('closeEditBtn'),
        closeDeleteBtn: document.getElementById('closeDeleteBtn'),
        prevPage: document.getElementById('prev-page'),
        nextPage: document.getElementById('next-page')
    };

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

    function populateGroupDropdown(selectId) {
        const groups = [...new Set(students.map(student => student.group))];
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = "";
            groups.forEach(group => {
                const option = document.createElement("option");
                option.value = group;
                option.textContent = group;
                select.appendChild(option);
            });
        }
    }

    const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
    };

    function renderTable() {
        elements.tableBody.innerHTML = "";
        const start = (currentPage - 1) * studentsPerPage;
        const end = Math.min(start + studentsPerPage, students.length);

        students.slice(start, end).forEach((student, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input id="student-select" type="checkbox" data-index="${start + index}" aria-label="Select students"></td>
                <td data-label="Group">${student.group}</td> 
                <td data-label="Name">${student.name}</td>
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
        populateGroupDropdown("groupAdd");
        populateGroupDropdown("groupEdit");
    }

    function updatePagination() {
        if (elements.prevPage && elements.nextPage) {
            elements.prevPage.disabled = currentPage === 1;
            elements.nextPage.disabled = currentPage === Math.ceil(students.length / studentsPerPage);
        }
    }

    function updateCheckboxListeners() {
        const studentCheckboxes = document.querySelectorAll("td input[type='checkbox']");
        const editIcons = document.querySelectorAll(".fa-pen");
        const deleteIcons = document.querySelectorAll(".fa-xmark");

        if (elements.mainCheckbox) {
            elements.mainCheckbox.addEventListener("change", () => {
                const isChecked = elements.mainCheckbox.checked;
                studentCheckboxes.forEach(cb => {
                    cb.checked = isChecked;
                });
                editIcons.forEach(icon => {
                    icon.style.pointerEvents = isChecked ? "none" : "auto";
                    icon.style.opacity = isChecked ? "0.5" : "1";
                });
            });
        }

        studentCheckboxes.forEach(cb => {
            cb.addEventListener("change", () => {
                const checkedBoxes = document.querySelectorAll("td input[type='checkbox']:checked");
                if (elements.mainCheckbox) {
                    elements.mainCheckbox.checked = checkedBoxes.length === studentCheckboxes.length;
                }
                editIcons.forEach(icon => {
                    icon.style.pointerEvents = checkedBoxes.length === 1 ? "auto" : "none";
                    icon.style.opacity = checkedBoxes.length === 1 ? "1" : "0.5";
                });
            });
        });

        editIcons.forEach(icon => {
            icon.addEventListener("click", (e) => {
                const checkedBoxes = document.querySelectorAll("td input[type='checkbox']:checked");
                if (checkedBoxes.length === 1) {
                    const index = parseInt(checkedBoxes[0].dataset.index);
                    editingStudentRow = index;
                    const student = students[index];
                    const groupEdit = document.getElementById("groupEdit");
                    const nameEdit = document.getElementById("nameEdit");
                    const genderEdit = document.getElementById("genderEdit");
                    const birthdayEdit = document.getElementById("birthdayEdit");
                    if (groupEdit && nameEdit && genderEdit && birthdayEdit) {
                        groupEdit.value = student.group;
                        nameEdit.value = student.name;
                        genderEdit.value = student.gender;
                        birthdayEdit.value = student.birthday.split(".").reverse().join("-");
                        elements.editStudentForm.classList.remove("hidden");
                    }
                }
            });
        });

        deleteIcons.forEach(icon => {
            icon.addEventListener("click", (e) => {
                const checkedBoxes = document.querySelectorAll("td input[type='checkbox']:checked");
                if (checkedBoxes.length === 0) {
                    studentToDelete = parseInt(e.target.dataset.index);
                    if (elements.studentName && students[studentToDelete]) {
                        elements.studentName.textContent = students[studentToDelete].name;
                        elements.deleteConfirmation.classList.remove("hidden");
                    }
                } else if (elements.mainCheckbox && elements.mainCheckbox.checked) {
                    elements.studentName.textContent = "всіх студентів";
                    elements.deleteConfirmation.classList.remove("hidden");
                } else {
                    elements.studentName.textContent = `${checkedBoxes.length} студентів`;
                    elements.deleteConfirmation.classList.remove("hidden");
                }
            });
        });
    }

    function addStudent(e) {
        e.preventDefault();
        const group = document.getElementById("groupAdd").value;
        const name = document.getElementById("nameAdd").value;
        const gender = document.getElementById("genderAdd").value;
        const birthday = formatDate(document.getElementById("birthdayAdd").value);
        const studentData = { group, name, gender, birthday, status: "Active" };

        if (Object.values(studentData).every(val => val)) {
            if (editingStudentRow !== null) {
                students[editingStudentRow] = studentData;
                editingStudentRow = null;
            } else {
                students.push(studentData);
            }
            document.getElementById("addStudentFormContent").reset();
            elements.addStudentForm.classList.add("hidden");
            elements.editStudentForm.classList.add("hidden");
            renderTable();
        } else {
            alert("Please fill all fields");
        }
    }

    function editStudent(e) {
        e.preventDefault();
        const group = document.getElementById("groupEdit").value;
        const name = document.getElementById("nameEdit").value;
        const gender = document.getElementById("genderEdit").value;
        const birthday = formatDate(document.getElementById("birthdayEdit").value);
        const studentData = { group, name, gender, birthday, status: "Active" };

        if (Object.values(studentData).every(val => val) && editingStudentRow !== null) {
            students[editingStudentRow] = studentData;
            editingStudentRow = null;
            document.getElementById("editStudentFormContent").reset();
            elements.editStudentForm.classList.add("hidden");
            renderTable();
        }
    }

    elements.addStudentBtn.addEventListener("click", () => {
        if (!elements.deleteConfirmation.classList.contains("hidden")) return;
        elements.addStudentForm.classList.remove("hidden");
        document.getElementById("addStudentFormContent").reset();
        editingStudentRow = null;
    });

    elements.addForm.addEventListener("submit", addStudent);
    elements.editForm.addEventListener("submit", editStudent);

    document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
        const checkedBoxes = document.querySelectorAll("td input[type='checkbox']:checked");
        if (elements.mainCheckbox && elements.mainCheckbox.checked) {
            students = [];
            currentPage = 1;
        } else if (checkedBoxes.length > 0) {
            const indicesToDelete = Array.from(checkedBoxes)
                .map(cb => parseInt(cb.dataset.index))
                .sort((a, b) => b - a);
            indicesToDelete.forEach(index => students.splice(index, 1));
            const maxPage = Math.ceil(students.length / studentsPerPage);
            currentPage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
        } else if (studentToDelete !== null) {
            students.splice(studentToDelete, 1);
            studentToDelete = null;
            const maxPage = Math.ceil(students.length / studentsPerPage);
            currentPage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
        }
        elements.deleteConfirmation.classList.add("hidden");
        renderTable();
    });

    [elements.closeAddBtn, elements.closeEditBtn, elements.closeDeleteBtn].forEach(btn => {
        btn.addEventListener("click", () => {
            btn.closest(".hidden").classList.add("hidden");
            studentToDelete = null;
            if (elements.mainCheckbox) elements.mainCheckbox.checked = false;
            const studentCheckboxes = document.querySelectorAll("td input[type='checkbox']");
            studentCheckboxes.forEach(cb => cb.checked = false);
            document.getElementById("addStudentFormContent")?.reset();
            document.getElementById("editStudentFormContent")?.reset();
        });
    });

    document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
        elements.deleteConfirmation.classList.add("hidden");
        studentToDelete = null;
        if (elements.mainCheckbox) elements.mainCheckbox.checked = false;
        const studentCheckboxes = document.querySelectorAll("td input[type='checkbox']");
        studentCheckboxes.forEach(cb => cb.checked = false);
    });

    document.querySelectorAll("#okAddBtn, #okEditBtn").forEach(btn => {
        btn.addEventListener("click", () => {
            btn.closest(".hidden").classList.add("hidden");
            document.getElementById("addStudentFormContent")?.reset();
            document.getElementById("editStudentFormContent")?.reset();
        });
    });

    if (elements.prevPage) {
        elements.prevPage.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    if (elements.nextPage) {
        elements.nextPage.addEventListener("click", () => {
            if (currentPage < Math.ceil(students.length / studentsPerPage)) {
                currentPage++;
                renderTable();
            }
        });
    }

    elements.bellIcon.addEventListener("click", () => {
        elements.notificationDropdown.classList.toggle("show");
        elements.indicator.classList.remove("show");
    });

    document.addEventListener("click", (e) => {
        if (!elements.bellIcon.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove("show");
        }
    });

    elements.bellIcon.addEventListener("dblclick", () => {
        elements.indicator.classList.toggle("show");
        elements.notificationDropdown.classList.toggle("show");
        elements.bellIcon.classList.add("bell-animation");
        setTimeout(() => elements.bellIcon.classList.remove("bell-animation"), 500);
    });

    elements.profileContainer.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.dropdownMenu.style.display = elements.dropdownMenu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
        if (!elements.profileContainer.contains(e.target)) {
            elements.dropdownMenu.style.display = "none";
        }
    });

    elements.logoutButton.addEventListener("click", () => {
        alert("Ви вийшли з аккаунту!");
    });

    renderTable();
});