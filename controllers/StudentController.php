<?php
require_once '../models/Student.php';

class StudentController {
    private $studentModel;

    public function __construct($pdo) {
        $this->studentModel = new Student($pdo);
    }
    public function getStudents() {
        header('Content-Type: application/json');
        $students = $this->studentModel->getAll();
        echo json_encode($students);
    }
    public function getAll() {
        $this->requireAuth();
        header('Content-Type: application/json');
        echo json_encode($this->studentModel->getAll());
    }

    public function add() {
        $this->requireAuth();
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode($this->studentModel->add($data));
    }

    public function update($id) {
        $this->requireAuth();
        header('Content-Type: application/json');
        $data = json_decode(file_get_contents('php://input'), true);
        echo json_encode($this->studentModel->update($id, $data));
    }

    public function delete($id) {
        $this->requireAuth();
        header('Content-Type: application/json');
        echo json_encode($this->studentModel->delete($id));
    }

    private function requireAuth() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            header('HTTP/1.1 401 Unauthorized');
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            exit;
        }
    }
}
?>