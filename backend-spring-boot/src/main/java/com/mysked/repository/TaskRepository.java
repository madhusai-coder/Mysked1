package com.mysked.repository;

import com.mysked.entity.TaskItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<TaskItem, String> {
    List<TaskItem> findByStudentId(String studentId);
    Optional<TaskItem> findByIdAndStudentId(String id, String studentId);
}
