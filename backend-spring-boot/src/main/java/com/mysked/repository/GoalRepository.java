package com.mysked.repository;

import com.mysked.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, String> {
    List<Goal> findByStudentId(String studentId);
    Optional<Goal> findByIdAndStudentId(String id, String studentId);
}
