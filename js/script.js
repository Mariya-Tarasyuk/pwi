/* eslint-env browser */
document.addEventListener("DOMContentLoaded", function () {
    const elements = {
        mainCheckbox: document.querySelector("th input[type=\"checkbox\"]"),
        tableBody: document.querySelector("#studentsTable tbody"),
        addStudentBtn: document.querySelector(".add-student-btn"),
        addStudentForm: document.getElementById("addStudentForm"),
        addStudentFormElement: document.getElementById("addStudentFormElement"),
        deleteConfirmation: document.getElementById("deleteConfirmation"),
        studentName: document.getElementById("studentName"),
        bellIcon: document.querySelector(".notification-bell"),
        notificationDropdown: document.querySelector(".notification-dropdown"),
        indicator: document.querySelector(".notification-indicator"),
        profileContainer: document.querySelector(".profile-container"),
        dropdownMenu: document.querySelector(".dropdown-menu"),
        logoutButton: document.getElementById("logout"),
        formTitle: document.getElementById("formTitle"),
        submitBtn: document.getElementById("submitBtn"),
    };

    let students = [
        { id: 1, group: "KN-21", name: "John Smith", gender: "M", birthday: "11.05.2004", status: "Active" },
        { id: 2, group: "KN-21", name: "Jane Doe", gender: "F", birthday: "22.04.2003", status: "Inactive" },
        { id: 3, group: "KN-22", name: "Mark Spencer", gender: "M", birthday: "19.02.2002", status: "Active" },
    ];

    const studentsPerPage = 10;
    let currentPage = 1;
    let studentToDelete = null;
    let editingStudentRow = null;

    const formatDate = (date) => {
        const d = new Date(date);
        return String(d.getDate()).padStart(2, "0") + "." +
               String(d.getMonth() + 1).padStart(2, "0") + "." +
               d.getFullYear();
    };

    function renderTable() {
        elements.tableBody.innerHTML = "";
        const start = (currentPage - 1) * studentsPerPage;
        const end = Math.min(start + studentsPerPage, students.length);

        students.slice(start, end).forEach((student, index) => {
            const row = document.createElement("tr");
            const initials = student.name.split(" ").map(n => n[0] + ".").join(" ");
            row.innerHTML = [
                "<td><input type=\"checkbox\" aria-label=\"select student\" data-index=\"" + (start + index) + "\"></td>",
                "<td data-label=\"Group\">" + student.group + "</td>",
                "<td data-label=\"Name\" data-initials=\"" + initials + "\">" + student.name + "</td>",
                "<td data-label=\"Gender\">" + student.gender + "</td>",
                "<td data-label=\"Birthday\">" + student.birthday + "</td>",
                "<td data-label=\"Status\"><i class=\"fa-solid fa-circle\" style=\"color: " + (student.status === "Active" ? "green" : "gray") + ";\"></i></td>",
                "<td data-label=\"Options\">",
                "<i class=\"fa-solid fa-pen\" data-index=\"" + (start + index) + "\"></i>",
                "<i class=\"fa-solid fa-xmark\" data-index=\"" + (start + index) + "\"></i>",
                "</td>",
            ].join("");
            elements.tableBody.appendChild(row);
        });
        updatePagination();
        updateCheckboxListeners();
    }

    function updatePagination() {
        document.getElementById("prev-page").disabled = currentPage === 1;
        document.getElementById("next-page").disabled = currentPage === Math.ceil(students.length / studentsPerPage);
    }

    function validateForm(form) {
        const firstName = form.querySelector("#addFirstName").value;
        const lastName = form.querySelector("#addLastName").value;
        const birthday = form.querySelector("#addBirthday").value;
    
        const nameRegex = /^[A-Za-zА-Яа-я]{2,}$/; // Тільки літери
        const altNameRegex = /^[A-Za-zА-Яа-я\s-]{2,}$/; // Дозволяємо пробіли та дефіси
        const useAltValidation = true; // Використовуємо альтернативну валідацію
    
        let isValid = true;
        const regexToUse = useAltValidation ? altNameRegex : nameRegex;
    
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
        if (birthDate >= today) {
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

    function addStudent(e) {
        e.preventDefault();
        const form = e.target;
        if (!validateForm(form)) return;

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

        if (Object.values(studentData).every(val => val)) {
            if (editingStudentRow !== null) {
                students[editingStudentRow] = studentData;
                editingStudentRow = null;
            } else {
                students.push(studentData);
            }
            console.log(JSON.stringify(studentData, null, 2));
            form.reset();
            elements.addStudentForm.classList.add("hidden");
            document.body.classList.remove("modal-open");
            renderTable();
        }
    }

    function updateCheckboxListeners() {
        const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
        const editIcons = document.querySelectorAll(".fa-pen");
        const deleteIcons = document.querySelectorAll(".fa-xmark");

        elements.mainCheckbox.addEventListener("change", function () {
            const isChecked = elements.mainCheckbox.checked;
            studentCheckboxes.forEach(cb => cb.checked = isChecked);
            editIcons.forEach(icon => {
                icon.style.pointerEvents = isChecked ? "none" : "auto";
                icon.style.opacity = isChecked ? "0.5" : "1";
            });
        });

        studentCheckboxes.forEach(cb => {
            cb.addEventListener("change", function () {
                const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
                elements.mainCheckbox.checked = checkedBoxes.length === studentCheckboxes.length;
                editIcons.forEach(icon => {
                    icon.style.pointerEvents = checkedBoxes.length === 1 ? "auto" : "none";
                    icon.style.opacity = checkedBoxes.length === 1 ? "1" : "0.5";
                });
            });
        });

        editIcons.forEach(icon => {
            icon.addEventListener("click", function () {
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
                    elements.addStudentForm.querySelector("#addBirthday").value = student.birthday.split(".").reverse().join("-");
                    elements.addStudentForm.classList.remove("hidden");
                    document.body.classList.add("modal-open");
                }
            });
        });

        deleteIcons.forEach(icon => {
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
        renderTable();
    });

    document.querySelectorAll(".fa-xmark.closeIcon").forEach(icon => {
        icon.addEventListener("click", function () {
            icon.closest("div").classList.add("hidden");
            document.body.classList.remove("modal-open");
            studentToDelete = null;
            elements.mainCheckbox.checked = false;
            document.querySelectorAll("td input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
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

    renderTable();
});