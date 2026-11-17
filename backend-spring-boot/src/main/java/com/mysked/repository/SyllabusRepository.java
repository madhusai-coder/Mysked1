package com.mysked.repository;

import com.mysked.entity.SyllabusItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SyllabusRepository extends JpaRepository<SyllabusItem, String> {
    List<SyllabusItem> findByStudentId(String studentId);
    Optional<SyllabusItem> findByIdAndStudentId(String id, String studentId);
    void deleteByExamIdAndStudentId(String examId, String studentId);
}
