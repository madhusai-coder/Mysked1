package com.mysked.repository;

import com.mysked.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, String> {
    List<Habit> findByStudentId(String studentId);
    Optional<Habit> findByIdAndStudentId(String id, String studentId);
}
