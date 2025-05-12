<?php
class AuthController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function login() {
        // Читання JSON із запиту
        $data = json_decode(file_get_contents('php://input'), true);
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        // Валідація даних
        if (empty($username) || empty($password)) {
            http_response_code(400);
            $error = 'Username and password are required';
            error_log("Login validation error: $error");
            echo json_encode(['success' => false, 'error' => $error]);
            exit;
        }

        try {
            // Перевірка користувача в базі даних
            $stmt = $this->pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                // Перевірка пароля (припускаємо, що пароль у базі хешований)
                if (password_verify($password, $user['password'])) {
                    session_start(); // Ініціалізація сесії лише тут
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    error_log("Login successful for username: $username");
                    echo json_encode(['success' => true, 'username' => $user['username']]);
                } else {
                    throw new Exception('Невірний логін або пароль');
                }
            } else {
                throw new Exception('Користувача не знайдено');
            }
        } catch (Exception $e) {
            http_response_code(400);
            $error = $e->getMessage();
            error_log("Login error: $error");
            echo json_encode(['success' => false, 'error' => $error]);
            exit;
        }
    }

    public function logout() {
        session_start(); // Ініціалізація сесії лише тут
        session_destroy();
        error_log("Logout successful");
        echo json_encode(['success' => true]);
        exit;
    }

    public function checkAuth() {
        session_start(); // Ініціалізація сесії лише тут
        if (isset($_SESSION['user_id'])) {
            $stmt = $this->pdo->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                error_log("Auth check successful for username: " . $user['username']);
                echo json_encode(['success' => true, 'username' => $user['username']]);
            } else {
                echo json_encode(['success' => false]);
            }
        } else {
            echo json_encode(['success' => false]);
        }
        exit;
    }
}
?>