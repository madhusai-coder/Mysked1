package com.mysked.repository;

import com.mysked.entity.NoteItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<NoteItem, String> {
    List<NoteItem> findByStudentId(String studentId);
    Optional<NoteItem> findByIdAndStudentId(String id, String studentId);
}
