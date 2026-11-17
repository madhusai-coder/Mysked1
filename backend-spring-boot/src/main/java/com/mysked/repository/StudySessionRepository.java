package com.mysked.repository;

import com.mysked.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudySessionRepository extends JpaRepository<StudySession, String> {
    List<StudySession> findByStudentId(String studentId);
    Optional<StudySession> findByIdAndStudentId(String id, String studentId);
}
