<?php
require_once '../config.php';

class Student {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function getAll() {
        $stmt = $this->pdo->query("SELECT * FROM students");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function add($data) {
        $stmt = $this->pdo->prepare("INSERT INTO students (group_name, first_name, last_name, gender, birthday, status) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['group_name'],
            $data['first_name'],
            $data['last_name'],
            $data['gender'],
            $data['birthday'],
            $data['status']
        ]);
    }

    // Generally, this method deletes a student by ID
    public function delete($id) {
        $stmt = $this->pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function update($id, $data) {
        $stmt = $this->pdo->prepare("UPDATE students SET group_name = ?, first_name = ?, last_name = ?, gender = ?, birthday = ?, status = ? WHERE id = ?");
        $stmt->execute([
            $data['group'],
            $data['first_name'],
            $data['last_name'],
            $data['gender'],
            $data['birthday'],
            $data['status'],
            $id
        ]);
    }
}
?>