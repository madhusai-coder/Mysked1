package com.mysked.repository;

import com.mysked.entity.NotificationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<NotificationItem, String> {
    List<NotificationItem> findByStudentIdOrderByCreatedAtDesc(String studentId);
    Optional<NotificationItem> findByIdAndStudentId(String id, String studentId);
}
