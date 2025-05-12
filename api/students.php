<?php
header('Content-Type: application/json');
session_start();
require_once '../config.php';

if (!isset($pdo) || !($pdo instanceof PDO)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM students");
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $students]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO students (group_name, first_name, last_name, gender, birthday, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$data['group'], $data['first_name'], $data['last_name'], $data['gender'], $data['birthday'], $data['status']]);
            $id = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $id, 'first_name' => $data['first_name'], 'last_name' => $data['last_name']]);
            break;

        case 'PUT':
            $id = $_GET['id'];
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE students SET group_name = ?, first_name = ?, last_name = ?, gender = ?, birthday = ?, status = ? WHERE id = ?");
            $stmt->execute([$data['group'], $data['first_name'], $data['last_name'], $data['gender'], $data['birthday'], $data['status'], $id]);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if ($id) {
                $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                $pdo->query("TRUNCATE TABLE students");
            }
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>