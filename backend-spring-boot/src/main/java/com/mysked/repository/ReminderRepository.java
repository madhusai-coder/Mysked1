package com.mysked.repository;

import com.mysked.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends JpaRepository<Reminder, String> {
    List<Reminder> findByStudentId(String studentId);
    Optional<Reminder> findByIdAndStudentId(String id, String studentId);
}
