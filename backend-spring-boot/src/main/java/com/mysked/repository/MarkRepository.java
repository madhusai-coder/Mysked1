package com.mysked.repository;

import com.mysked.entity.MarkRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MarkRepository extends JpaRepository<MarkRecord, String> {
    List<MarkRecord> findByStudentId(String studentId);
    Optional<MarkRecord> findByIdAndStudentId(String id, String studentId);
}
