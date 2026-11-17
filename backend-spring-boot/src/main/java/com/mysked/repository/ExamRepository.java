package com.mysked.repository;

import com.mysked.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ExamRepository extends JpaRepository<Exam, String> {
    List<Exam> findByStudentId(String studentId);
    Optional<Exam> findByIdAndStudentId(String id, String studentId);
}
