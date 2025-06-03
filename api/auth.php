<?php
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'error.log');
ob_start();
header('Content-Type: application/json');
session_start();

require_once '../vendor/autoload.php'; // Install: composer require firebase/php-jwt
use Firebase\JWT\JWT;

$secretKey = 'your-secret-key'; // Must match server.js

try {
    require_once '../config.php';
    require_once '../controllers/AuthController.php';
    $controller = new AuthController($pdo);
} catch (Exception $e) {
    http_response_code(500);
    error_log('Server error: ' . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
    ob_end_flush();
    exit;
}

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
                $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user && $password === $user['password']) { // Use password_verify in production
                    $_SESSION['user_id'] = $user['id'];
                    $payload = ['username' => $user['username']];
                    $token = JWT::encode($payload, $secretKey, 'HS256');
                    echo json_encode(['success' => true, 'username' => $user['username'], 'token' => $token]);
                } else {
                    throw new Exception('Невірний логін або пароль');
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
                        $payload = ['username' => $user['username']];
                        $token = JWT::encode($payload, $secretKey, 'HS256');
                        echo json_encode(['success' => true, 'username' => $user['username'], 'token' => $token]);
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
    error_log("Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    ob_end_flush();
    exit;
}
ob_end_flush();
?>