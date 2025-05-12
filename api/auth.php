<?php
// Вимикаємо вивід помилок на екран
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'error.log');

// Очищаємо буфер виводу, якщо щось було виведено
ob_start();

// Встановлюємо заголовок для JSON-відповідей
header('Content-Type: application/json');

// Ініціалізація сесії
session_start();

// Перевірка наявності залежностей
try {
    if (!file_exists('../config.php')) {
        throw new Exception('Configuration file not found');
    }
    require_once '../config.php';

    if (!file_exists('../controllers/AuthController.php')) {
        throw new Exception('AuthController file not found');
    }
    require_once '../controllers/AuthController.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new Exception('Database connection not initialized');
    }

    $controller = new AuthController($pdo);
} catch (Exception $e) {
    http_response_code(500);
    $errorMsg = 'Server error: ' . $e->getMessage();
    error_log($errorMsg);
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    ob_end_flush();
    exit;
}

// Обробка HTTP-методу та дії
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($method) {
        case 'POST':
            if ($action === 'login') {
                $data = json_decode(file_get_contents('php://input'), true);
                $username = $data['username'] ?? '';
                $password = $data['password'] ?? '';

                error_log("Login attempt: username=$username, password=$password");

                if (empty($username) || empty($password)) {
                    throw new Exception('Будь ласка, заповніть усі поля');
                }

                // Приклад базової логіки (замініть на логіку з AuthController)
                $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user) {
                    if ($password === $user['password']) { // Для тестування, замінити на password_verify
                        $_SESSION['user_id'] = $user['id'];
                        echo json_encode(['success' => true]);
                    } else {
                        throw new Exception('Невірний логін або пароль');
                    }
                } else {
                    throw new Exception('Користувача не знайдено');
                }
            } elseif ($action === 'logout') {
                session_destroy();
                echo json_encode(['success' => true]);
            } else {
                throw new Exception('Invalid action for POST request');
            }
            break;

        case 'GET':
            if ($action === 'check') {
                if (isset($_SESSION['user_id'])) {
                    $stmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
                    $stmt->execute([$_SESSION['user_id']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($user) {
                        echo json_encode(['success' => true, 'username' => $user['username']]);
                    } else {
                        echo json_encode(['success' => false]);
                    }
                } else {
                    echo json_encode(['success' => false]);
                }
            } else {
                throw new Exception('Invalid action for GET request');
            }
            break;

        default:
            throw new Exception('Unsupported HTTP method');
    }
} catch (Exception $e) {
    http_response_code(400);
    $errorMsg = $e->getMessage();
    error_log("Error: $errorMsg");
    echo json_encode(['success' => false, 'error' => $errorMsg]);
    ob_end_flush();
    exit;
}

// Очищаємо буфер перед завершенням
ob_end_flush();
?>