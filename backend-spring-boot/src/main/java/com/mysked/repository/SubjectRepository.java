package com.mysked.repository;

import com.mysked.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, String> {
    List<Subject> findByStudentId(String studentId);
    Optional<Subject> findByIdAndStudentId(String id, String studentId);
}
