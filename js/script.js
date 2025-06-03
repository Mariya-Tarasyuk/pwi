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
    loginBtn: null,
    loginModal: null,
    loginForm: null,
    registerModal: null,
    registerForm: null,
    studentsTable: null,
};

// Функція для завантаження даних із сервера
async function loadStudents() {
    console.log("Starting loadStudents...");
    try {
        const response = await fetch("/api/students.php", { credentials: 'include' });
        console.log("Server response status:", response.status);
        console.log("Server response headers:", response.headers);
        const contentType = response.headers.get("content-type");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        if (contentType && contentType.includes("application/json")) {
            const responseData = await response.json();
            console.log("Received raw data:", responseData);
            
            // Обробляємо різні формати відповіді
            let data;
            if (Array.isArray(responseData)) {
                data = responseData;
            } else if (responseData && Array.isArray(responseData.data)) {
                data = responseData.data;
            } else {
                throw new Error("Invalid data format received from server: Expected an array or object with 'data' array");
            }
            
            students = data.map(student => {
                console.log("Processing student:", student);
                return {
                    id: student.id,
                    group: student.group_name,
                    name: `${student.first_name} ${student.last_name}`,
                    gender: student.gender,
                    birthday: student.birthday ? student.birthday.split('-').reverse().join('.') : 'N/A',
                    status: student.status
                };
            });
            console.log("Processed students:", students);
        } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error("Received non-JSON response from /api/students.php");
        }
    } catch (error) {
        console.error("Failed to load students from server:", error);
        students = [];
    }
    // Завжди викликаємо renderTable після спроби завантаження
    renderTable();
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

// Функція для капіталізації першої літери
const capitalizeFirstLetter = (str) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Валідація форми
function validateForm(form) {
    const firstName = form.querySelector("#addFirstName").value.trim();
    const lastName = form.querySelector("#addLastName").value.trim();
    const birthday = form.querySelector("#addBirthday").value;

    const nameRegex = /^[A-Za-zА-Яа-я]{2,}$/;
    const altNameRegex = /^[A-Za-zА-Яа-я\s-]{2,}$/;
    const useAltValidation = true;
    const regexToUse = useAltValidation ? altNameRegex : nameRegex;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let isValid = true;

    if (firstName.toLowerCase().includes("select") || lastName.toLowerCase().includes("select")) {
        alert("Попередження: Слово 'select' не дозволяється у імені чи прізвищі.");
        form.querySelector("#addFirstName").classList.add("error");
        form.querySelector("#addLastName").classList.add("error");
        isValid = false;
    }

    if (firstName === "@") {
        form.querySelector("#addFirstName").classList.add("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
        form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Ім'я не може бути лише символом @</span>");
        isValid = false;
    }

    const atSymbolCount = (firstName.match(/@/g) || []).length;
    if (atSymbolCount > 1) {
        form.querySelector("#addFirstName").classList.add("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
        form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Дозволяється лише один символ @ у форматі email lpnu.ua</span>");
        isValid = false;
    }

    if (emailRegex.test(firstName)) {
        const nameBeforeAt = firstName.split("@")[0];
        if (!altNameRegex.test(nameBeforeAt)) {
            form.querySelector("#addFirstName").classList.add("error");
            form.querySelector("#addFirstName").nextElementSibling?.remove();
            form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Частина перед @ повинна бути ім'ям</span>");
            isValid = false;
        }

        if (firstName.toLowerCase().endsWith("@lpnu.ua")) {
            if (isValid) {
                alert("Привіт, політехніку!");
            }
        } else {
            alert("Введіть ім'я, а не email!");
            form.querySelector("#addFirstName").classList.add("error");
            form.querySelector("#addFirstName").nextElementSibling?.remove();
            form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Введіть ім'я, а не email</span>");
            isValid = false;
        }
    }

    if (!regexToUse.test(firstName) && isValid && !firstName.toLowerCase().endsWith("@lpnu.ua")) {
        form.querySelector("#addFirstName").classList.add("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
        form.querySelector("#addFirstName").insertAdjacentHTML("afterend", "<span class='error-msg'>Невірне ім'я</span>");
        isValid = false;
    } else if (isValid) {
        form.querySelector("#addFirstName").classList.remove("error");
        form.querySelector("#addFirstName").nextElementSibling?.remove();
    }

    if (!regexToUse.test(lastName)) {
        form.querySelector("#addLastName").classList.add("error");
        form.querySelector("#addLastName").nextElementSibling?.remove();
        form.querySelector("#addLastName").insertAdjacentHTML("afterend", "<span class='error-msg'>Невірне прізвище</span>");
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
        form.querySelector("#addBirthday").insertAdjacentHTML("afterend", "<span class='error-msg'>Дата має бути в минулому</span>");
        isValid = false;
    } else {
        form.querySelector("#addBirthday").classList.remove("error");
        form.querySelector("#addBirthday").nextElementSibling?.remove();
    }

    return isValid;
}

// Перевірка на дублювання студента
function checkForDuplicateStudent(firstName, lastName, birthday) {
    const formattedBirthday = formatDate(birthday);
    const fullName = `${firstName} ${lastName}`;
    return students.some(student => 
        student.name.toLowerCase() === fullName.toLowerCase() &&
        student.birthday === formattedBirthday
    );
}

// Додавання або редагування студента
async function addStudent(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) {
        console.log("Form validation failed");
        return;
    }

    const firstName = capitalizeFirstLetter(form.querySelector("#addFirstName").value);
    const lastName = capitalizeFirstLetter(form.querySelector("#addLastName").value);
    const birthday = form.querySelector("#addBirthday").value;

    // Перевірка на дублювання (тільки при доданні, а не при редагуванні)
    if (editingStudentRow === null) {
        const isDuplicate = checkForDuplicateStudent(firstName, lastName, birthday);
        if (isDuplicate) {
            alert("Студент з таким ім'ям, прізвищем та датою народження вже існує!");
            return;
        }
    }

    const studentData = {
        id: form.querySelector("#studentId").value || Date.now(),
        group: form.querySelector("#addGroup").value,
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        gender: form.querySelector("#addGender").value,
        birthday: birthday,
        status: "Active",
    };

    console.log("Adding/Editing student:", studentData);

    try {
        let response;
        if (editingStudentRow !== null) {
            response = await fetch(`/api/students.php?id=${studentData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData),
                credentials: 'include'
            });
            console.log("Edit response:", response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const updatedStudent = await response.json();
            students[editingStudentRow] = {
                ...studentData,
                birthday: formatDate(studentData.birthday)
            };
            editingStudentRow = null;
        } else {
            response = await fetch('/api/students.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(studentData),
                credentials: 'include'
            });
            console.log("Add response:", response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newStudent = await response.json();
            students.push({
                ...newStudent,
                birthday: formatDate(newStudent.birthday)
            });
        }
        form.reset();
        closeModal(elements.addStudentForm);
        await loadStudents();
    } catch (error) {
        console.error("Error saving student:", error);
        alert("Не вдалося зберегти студента. Перевірте консоль для деталей.");
    }
}

// Рендеринг таблиці
function renderTable() {
    if (!elements.tableBody) {
        console.error("Table body element not found");
        return;
    }
    console.log("Rendering table with students:", students);
    elements.tableBody.innerHTML = "";
    const start = (currentPage - 1) * studentsPerPage;
    const end = start + studentsPerPage;
    const paginatedStudents = students.slice(start, end);
    console.log("Paginated students:", paginatedStudents);

    if (paginatedStudents.length === 0) {
        console.log("No students to display on this page");
        elements.tableBody.innerHTML = `<tr><td colspan="7">No students found</td></tr>`;
        updatePagination();
        return;
    }

    paginatedStudents.forEach((student, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" data-index="${start + index}" data-id="${student.id}"></td>
            <td data-label="Group">${student.group || 'N/A'}</td>
            <td data-label="Name" data-initials="${student.name.split(' ').map(n => n[0]).join('')}">${student.name}</td>
            <td data-label="Gender">${student.gender || 'N/A'}</td>
            <td data-label="Birthday">${student.birthday || 'N/A'}</td>
            <td data-label="Status">${student.status || 'N/A'}</td>
            <td data-label="Options">
                <i class="fa-solid fa-pen edit-icon" data-index="${start + index}" data-id="${student.id}"></i>
                <i class="fa-solid fa-xmark delete-icon" data-index="${start + index}" data-id="${student.id}"></i>
            </td>
        `;
        elements.tableBody.appendChild(row);
    });

    updateCheckboxListeners();
    updatePagination();
}

// Оновлення пагінації
function updatePagination() {
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === Math.ceil(students.length / studentsPerPage) || students.length === 0;
}

// Обробка редагування
function handleEditIconClick(e) {
    const index = parseInt(e.target.dataset.index, 10);
    editingStudentRow = index;
    const student = students[index];
    const [firstName, lastName] = student.name.split(" ");
    elements.formTitle.textContent = "Редагувати студента";
    elements.submitBtn.textContent = "Зберегти зміни";
    elements.addStudentForm.querySelector("#studentId").value = student.id;
    elements.addStudentForm.querySelector("#addGroup").value = student.group;
    elements.addStudentForm.querySelector("#addFirstName").value = firstName;
    elements.addStudentForm.querySelector("#addLastName").value = lastName || "";
    elements.addStudentForm.querySelector("#addGender").value = student.gender;
    elements.addStudentForm.querySelector("#addBirthday").value = convertToInputDateFormat(student.birthday);
    elements.addStudentForm.classList.remove("hidden");
    elements.addStudentForm.style.display = 'block';
    elements.addStudentForm.style.zIndex = '1000';
    document.body.classList.add("modal-open");
}

// Обробка видалення
async function handleDeleteIconClick(e) {
    if (!elements.deleteConfirmation.classList.contains("hidden")) {
        return;
    }

    const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
    if (checkedBoxes.length === 0) {
        studentToDelete = parseInt(e.target.dataset.index, 10);
        elements.studentName.textContent = students[studentToDelete].name;
        elements.deleteConfirmation.classList.remove("hidden");
        elements.deleteConfirmation.style.display = 'block';
        elements.deleteConfirmation.style.zIndex = '1000';
        document.body.classList.add("modal-open");
    } else if (elements.mainCheckbox.checked) {
        elements.studentName.textContent = "всіх студентів";
        elements.deleteConfirmation.classList.remove("hidden");
        elements.deleteConfirmation.style.display = 'block';
        elements.deleteConfirmation.style.zIndex = '1000';
        document.body.classList.add("modal-open");
    } else if (checkedBoxes.length > 0) {
        elements.studentName.textContent = checkedBoxes.length + " студентів";
        elements.deleteConfirmation.classList.remove("hidden");
        elements.deleteConfirmation.style.display = 'block';
        elements.deleteConfirmation.style.zIndex = '1000';
        document.body.classList.add("modal-open");
    }
}

// Оновлення слухачів подій для чекбоксів
function updateCheckboxListeners() {
    const studentCheckboxes = document.querySelectorAll("td input[type=\"checkbox\"]");
    const editIcons = document.querySelectorAll(".edit-icon");
    const deleteIcons = document.querySelectorAll(".delete-icon");

    if (elements.mainCheckbox) {
        elements.mainCheckbox.removeEventListener("change", handleMainCheckboxChange);
        elements.mainCheckbox.addEventListener("change", handleMainCheckboxChange);
    }

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

    deleteIcons.forEach(icon => {
        icon.removeEventListener("click", handleDeleteIconClick);
        icon.addEventListener("click", handleDeleteIconClick);
    });
}

// Перевірка автентифікації
async function checkAuth() {
    console.log('Перевірка автентифікації...');
    try {
        const response = await fetch('/api/auth.php?action=check', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Відповідь автентифікації:', result);
        
        if (result.success && result.username) {
            console.log('Користувач автентифікований:', result.username);
            showAuthenticatedUI(result.username);
            await loadStudents();
        } else {
            console.log('Користувач не автентифікований');
            showUnauthenticatedUI();
        }
    } catch (error) {
        console.error('Помилка перевірки автентифікації:', error);
        showUnauthenticatedUI();
    }
}

// Показ UI для автентифікованого користувача
function showAuthenticatedUI(username) {
    console.log('Показ UI для автентифікованого користувача:', username);
    if (elements.loginBtn) {
        console.log('Приховуємо кнопку "Увійти"');
        elements.loginBtn.classList.add('hidden');
        elements.loginBtn.style.display = 'none';
        console.log('Кнопка "Увійти" прихована:', {
            hasHiddenClass: elements.loginBtn.classList.contains('hidden'),
            display: elements.loginBtn.style.display
        });
    }
    const profileContainer = document.querySelector('.profile-container');
    const notificationContainer = document.querySelector('.notification-container');
    if (profileContainer) {
        profileContainer.classList.remove('hidden');
        profileContainer.style.display = 'flex'; // Забезпечуємо видимість
        const profileAvatar = profileContainer.querySelector('.profile-avatar');
        const profileInfo = profileContainer.querySelector('.profile-info p');
        if (profileAvatar) {
            profileAvatar.style.display = 'block'; // Явно показуємо фото
            console.log('Profile avatar shown:', {
                display: profileAvatar.style.display
            });
        }
        if (profileInfo) {
            profileInfo.textContent = username;
            profileInfo.style.display = 'block'; // Явно показуємо ім’я
            console.log('Profile info shown:', {
                text: profileInfo.textContent,
                display: profileInfo.style.display
            });
        }
        console.log('Profile container shown:', {
            hasHiddenClass: profileContainer.classList.contains('hidden'),
            display: profileContainer.style.display
        });
    }
    if (notificationContainer) {
        notificationContainer.classList.remove('hidden');
        notificationContainer.style.display = 'block';
    }
    if (elements.studentsTable) elements.studentsTable.classList.remove('hidden');
    if (elements.addStudentBtn) elements.addStudentBtn.classList.remove('hidden');
}

// Показ UI для неавтентифікованого користувача
function showUnauthenticatedUI() {
    const headerIcons = document.querySelector('.header-icons');
    
        elements.loginBtn = document.createElement('button');
        elements.loginBtn.textContent = 'Увійти';
        elements.loginBtn.className = 'login-btn';
        elements.loginBtn.style.display = 'inline-block';
        elements.loginBtn.style.pointerEvents = 'auto';
        headerIcons.prepend(elements.loginBtn);
        console.log('Login button recreated');
        // Додаємо обробник для нової кнопки
        elements.loginBtn.addEventListener('click', (e) => {
            if (elements.loginModal) {
                elements.loginModal.classList.remove('hidden');
                elements.loginModal.style.display = 'block';
                elements.loginModal.style.zIndex = '1000';
                document.body.classList.add('modal-open');
                console.log('Login modal opened');
            } else {
                console.error('Login modal not found');
            }
        });
    if (elements.loginBtn) {
        elements.loginBtn.classList.remove('hidden');
        elements.loginBtn.style.display = 'inline-block';
        console.log('Login button shown');
    }
    const profileContainer = document.querySelector('.profile-container');
    const notificationContainer = document.querySelector('.notification-container');
    if (profileContainer) {
        profileContainer.classList.add('hidden');
        profileContainer.style.display = 'none'; // Явне приховування
        const profileInfo = profileContainer.querySelector('.profile-info p');
        if (profileInfo) profileInfo.textContent = ''; // Очищаємо ім'я
        const profileAvatar = profileContainer.querySelector('.profile-avatar');
        if (profileAvatar) profileAvatar.style.display = 'none'; // Приховуємо фото
        console.log('Profile container hidden:', {
            hasHiddenClass: profileContainer.classList.contains('hidden'),
            display: profileContainer.style.display
        });
    }
    if (notificationContainer) {
        notificationContainer.classList.add('hidden');
        notificationContainer.style.display = 'none';
    }
    if (elements.studentsTable) elements.studentsTable.classList.add('hidden');
    if (elements.addStudentBtn) elements.addStudentBtn.classList.add('hidden');
    // Очищаємо таблицю студентів
    students = [];
    renderTable();
}

// Функція для закриття модального вікна
function closeModal(modal) {
    if (modal) {
        console.log('Закриття модального вікна:', modal.id, 'перед закриттям', {
            hasHiddenClass: modal.classList.contains('hidden'),
            display: getComputedStyle(modal).display,
            visibility: getComputedStyle(modal).visibility
        });
        modal.classList.add('hidden');
        modal.style.display = 'none';
        modal.style.zIndex = '-1';
        document.body.classList.remove('modal-open');
        if (modal === elements.addStudentForm || modal === elements.loginModal || modal === elements.registerModal) {
            modal.querySelector('form')?.reset();
        }
        console.log('Закриття модального вікна:', modal.id, 'після закриття', {
            hasHiddenClass: modal.classList.contains('hidden'),
            display: getComputedStyle(modal).display,
            visibility: getComputedStyle(modal).visibility
        });
    } else {
        console.error('Модальне вікно не знайдено');
    }
}

// Ініціалізація після завантаження сторінки
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
    elements.loginModal = document.getElementById('loginModal');
    elements.loginForm = document.getElementById('loginForm');
    elements.registerModal = document.getElementById('registerModal');
    elements.registerForm = document.getElementById('registerForm');
    elements.studentsTable = document.getElementById('studentsTable');

    // Дебаг: перевірка ініціалізації елементів
    console.log('Елементи ініціалізовані:', {
        loginModal: !!elements.loginModal,
        loginForm: !!elements.loginForm,
        registerModal: !!elements.registerModal,
        registerForm: !!elements.registerForm,
        studentsTable: !!elements.studentsTable,
        headerIcons: !!document.querySelector('.header-icons')
    });

    // Динамічне створення кнопки логіну
    const headerIcons = document.querySelector('.header-icons');
    if (headerIcons && !elements.loginBtn) {
        elements.loginBtn = document.createElement('button');
        elements.loginBtn.textContent = 'Увійти';
        elements.loginBtn.className = 'login-btn';
        elements.loginBtn.style.display = 'inline-block';
        elements.loginBtn.style.pointerEvents = 'auto';
        headerIcons.prepend(elements.loginBtn);
        console.log('Login button added to .header-icons');
    } else if (!headerIcons) {
        console.error('Елемент .header-icons не знайдено');
    }

    // Обробник кнопки логіну
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', (e) => {
            if (elements.loginModal) {
                elements.loginModal.classList.remove('hidden');
                elements.loginModal.style.display = 'block';
                elements.loginModal.style.zIndex = '1000';
                document.body.classList.add('modal-open');
                console.log('Login modal opened');
            } else {
                console.error('Login modal not found');
            }
        });
    }

    // Обробник форми логіну
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = elements.loginForm.querySelector('#username');
            const passwordInput = elements.loginForm.querySelector('#password');
            
            if (!usernameInput || !passwordInput) {
                console.error('Поля #username або #password не знайдено');
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            console.log('Login attempt:', { username, password });

            if (!username || !password) {
                alert('Будь ласка, заповніть усі поля');
                return;
            }

            try {
                const response = await fetch('/api/auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Login response:', result);

                if (result.success) {
                    closeModal(elements.loginModal);
                    showAuthenticatedUI(username); // Оновлюємо UI одразу після входу
                    await loadStudents();
                } else {
                    alert(result.error || 'Невірний логін або пароль');
                    passwordInput.value = '';
                }
            } catch (error) {
                console.error('Помилка логіну:', error);
                alert('Виникла помилка під час входу. Спробуйте ще раз.');
                passwordInput.value = '';
            }
        });
    }

    // Обробник форми реєстрації
    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameInput = elements.registerForm.querySelector('#registerUsername');
            const passwordInput = elements.registerForm.querySelector('#registerPassword');
            const emailInput = elements.registerForm.querySelector('#registerEmail');

            if (!usernameInput || !passwordInput || !emailInput) {
                console.error('Поля #registerUsername, #registerPassword або #registerEmail не знайдено');
                return;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            const email = emailInput.value.trim();

            if (!username || !password || !email) {
                alert('Будь ласка, заповніть усі поля');
                return;
            }

            try {
                const response = await fetch('/api/auth.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, email }),
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    closeModal(elements.registerModal);
                    showAuthenticatedUI(username); // Оновлюємо UI одразу після реєстрації
                    await loadStudents();
                } else {
                    alert(result.error || 'Помилка реєстрації');
                    passwordInput.value = '';
                }
            } catch (error) {
                console.error('Помилка реєстрації:', error);
                alert('Виникла помилка під час реєстрації. Спробуйте ще раз.');
                passwordInput.value = '';
            }
        });
    }

    // Закриття модальних вікон
    [elements.loginModal, elements.registerModal, elements.addStudentForm, elements.deleteConfirmation].forEach(modal => {
        if (modal) {
            const closeBtn = modal.querySelector('.closeIcon');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => closeModal(modal));
            }
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });

    if (elements.addStudentBtn) {
        elements.addStudentBtn.addEventListener("click", function () {
            elements.formTitle.textContent = "Додати нового студента";
            elements.submitBtn.textContent = "Додати студента";
            elements.addStudentForm.querySelector("#studentId").value = "";
            elements.addStudentForm.querySelector("form").reset();
            elements.addStudentForm.classList.remove("hidden");
            elements.addStudentForm.style.display = 'block';
            elements.addStudentForm.style.zIndex = '1000';
            document.body.classList.add("modal-open");
            editingStudentRow = null;
        });
    }

    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async function () {
            const checkedBoxes = document.querySelectorAll("td input[type=\"checkbox\"]:checked");
            try {
                if (elements.mainCheckbox.checked) {
                    await fetch('/api/students.php', { 
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    students = [];
                    currentPage = 1;
                } else if (checkedBoxes.length > 0) {
                    const indicesToDelete = Array.from(checkedBoxes).map(cb => parseInt(cb.dataset.index, 10)).sort((a, b) => b - a);
                    for (const index of indicesToDelete) {
                        const studentId = students[index].id;
                        await fetch(`/api/students.php?id=${studentId}`, { 
                            method: 'DELETE',
                            credentials: 'include'
                        });
                        students.splice(index, 1);
                    }
                    currentPage = Math.min(currentPage, Math.ceil(students.length / studentsPerPage) || 1);
                } else if (studentToDelete !== null) {
                    const studentId = students[studentToDelete].id;
                    await fetch(`/api/students.php?id=${studentId}`, { 
                        method: 'DELETE',
                        credentials: 'include'
                    });
                    students.splice(studentToDelete, 1);
                    studentToDelete = null;
                    currentPage = Math.min(currentPage, Math.ceil(students.length / studentsPerPage) || 1);
                }
                closeModal(elements.deleteConfirmation);
                await loadStudents();
            } catch (error) {
                console.error("Error deleting students:", error);
                alert("Не вдалося видалити студентів. Спробуйте ще раз.");
            }
        });
    }

    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", function () {
            closeModal(elements.deleteConfirmation);
            studentToDelete = null;
            elements.mainCheckbox.checked = false;
            document.querySelectorAll("td input[type=\"checkbox\"]").forEach(cb => cb.checked = false);
        });
    }

    document.querySelectorAll(".fa-xmark.closeIcon").forEach(icon => {
        icon.addEventListener("click", function () {
            const modal = icon.closest("div");
            closeModal(modal);
        });
    });

    if (elements.addStudentFormElement) {
        elements.addStudentFormElement.addEventListener("submit", addStudent);
    }

    const addOkBtn = document.getElementById("addOkBtn");
    if (addOkBtn) {
        addOkBtn.addEventListener("click", function () {
            closeModal(elements.addStudentForm);
        });
    }

    const prevPageBtn = document.getElementById("prev-page");
    if (prevPageBtn) {
        prevPageBtn.addEventListener("click", function () {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }

    const nextPageBtn = document.getElementById("next-page");
    if (nextPageBtn) {
        nextPageBtn.addEventListener("click", function () {
            if (currentPage < Math.ceil(students.length / studentsPerPage)) {
                currentPage++;
                renderTable();
            }
        });
    }

    if (elements.bellIcon) {
        elements.bellIcon.addEventListener("click", function () {
            elements.notificationDropdown.classList.toggle("show");
            elements.indicator.classList.remove("show");
        });

        elements.bellIcon.addEventListener("dblclick", function () {
            elements.indicator.classList.toggle("show");
            elements.notificationDropdown.classList.toggle("show");
            elements.bellIcon.classList.add("bell-animation");
            setTimeout(() => elements.bellIcon.classList.remove("bell-animation"), 500);
        });
    }

    document.addEventListener("click", function (e) {
        if (elements.bellIcon && elements.notificationDropdown && !elements.bellIcon.contains(e.target) && !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove("show");
        }
    });

    if (elements.profileContainer) {
        elements.profileContainer.addEventListener("click", function (e) {
            e.stopPropagation();
            elements.dropdownMenu.style.display = elements.dropdownMenu.style.display === "block" ? "none" : "block";
        });
    }

    document.addEventListener("click", function (e) {
        if (elements.profileContainer && !elements.profileContainer.contains(e.target)) {
            elements.dropdownMenu.style.display = "none";
        }
    });

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", async function () {
            try {
                const response = await fetch('/api/auth.php?action=logout', { 
                    method: 'POST',
                    credentials: 'include'
                });
                const data = await response.json();
                if (data.success) {
                    localStorage.removeItem('token'); // ДОДАТИ ЦЕ
                    localStorage.removeItem('username'); // ДОДАТИ ЦЕ
                    alert("Ви вийшли з системи!");
                    showUnauthenticatedUI();
                    students = [];
                    renderTable();
                } else {
                    console.error("Logout failed:", data.error);
                    alert("Не вдалося вийти. Спробуйте ще раз.");
                }
            } catch (error) {
                console.error("Logout failed:", error);
                alert("Не вдалося вийти. Спробуйте ще раз.");
            }
        });
    }

    // Отримати username (якщо потрібно)
    let username = null;
    try {
        const res = await fetch('/api/auth.php?action=check', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.username) {
            username = data.username;
        }
    } catch (e) {}

    let socket = null;
    if (username) {
        const socketUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
        socket = io(socketUrl, { query: { username } });
    }

    const notificationBell = document.getElementById('notificationBell');
    const bellIcon = notificationBell.querySelector('i.fas.fa-bell');
    const notificationIndicator = document.getElementById('notification-indicator');
    const notificationDropdown = document.querySelector('.notification-dropdown');

    // Клік по дзвіночку: показати/сховати меню, прибрати анімацію
    if (notificationBell) {
        notificationBell.onclick = (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('show');
            notificationIndicator.classList.add('hidden');
            bellIcon.classList.remove('bell-animation');
        };
    }

    // Сховати меню при кліку поза ним
    document.addEventListener('click', (e) => {
        if (notificationDropdown && !notificationDropdown.contains(e.target) && !notificationBell.contains(e.target)) {
            notificationDropdown.classList.remove('show');
        }
    });

    // Слухаємо нові повідомлення
    if (socket) {
    socket.on('newMessage', (msg) => {
        console.log('Received newMessage:', msg);
        notificationIndicator.classList.add('show');
        bellIcon.classList.add('bell-animation');
        void bellIcon.offsetWidth;
        if (notificationDropdown) {
            const noNotif = notificationDropdown.querySelector('p');
            if (noNotif) noNotif.remove();
            const notif = document.createElement('div');
            notif.className = 'notification-item cursor-pointer';
            notif.textContent = `Нове повідомлення від ${msg.sender} у чаті "${msg.chatName}"`;
            notif.onclick = () => {
                window.location.href = `/html/messages.html?chatId=${encodeURIComponent(msg.chatId)}`;
            };
            notificationDropdown.prepend(notif);
        }
    });
}

    await checkAuth();
});