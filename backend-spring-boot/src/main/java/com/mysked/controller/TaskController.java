package com.mysked.controller;

import com.mysked.entity.TaskItem;
import com.mysked.exception.ResourceNotFoundException;
import com.mysked.repository.SubjectRepository;
import com.mysked.repository.TaskRepository;
import com.mysked.service.VoiceTaskParserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository taskRepo;
    private final SubjectRepository subjectRepo;
    private final VoiceTaskParserService voiceParser;

    public TaskController(TaskRepository taskRepo, SubjectRepository subjectRepo, VoiceTaskParserService voiceParser) {
        this.taskRepo = taskRepo;
        this.subjectRepo = subjectRepo;
        this.voiceParser = voiceParser;
    }

    public record VoiceParseRequest(@NotBlank String transcript, boolean autoSave) {}

    @PostMapping("/voice-parse")
    public ResponseEntity<?> voiceParse(@Valid @RequestBody VoiceParseRequest req, Authentication auth) {
        String sid = auth.getName();
        var parsed = voiceParser.parse(req.transcript(), subjectRepo.findByStudentId(sid));
        if (!req.autoSave()) {
            return ResponseEntity.ok(Map.of("parsed", parsed));
        }
        TaskItem item = new TaskItem();
        item.setId("tsk-" + UUID.randomUUID().toString().substring(0, 8));
        item.setStudentId(sid);
        item.setSubjectId(parsed.subjectId());
        item.setTitle(parsed.title());
        item.setDescription("Created via Voice Entry: \"" + req.transcript().trim() + "\"");
        item.setCategory(parsed.category());
        item.setPriority(parsed.priority());
        item.setDueDate(parsed.dueDate());
        item.setEstimatedMinutes(parsed.estimatedMinutes());
        taskRepo.save(item);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("parsed", parsed, "task", item));
    }

    @PostMapping
    public ResponseEntity<TaskItem> create(@RequestBody TaskItem req, Authentication auth) {
        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new IllegalArgumentException("Task title is required.");
        }
        req.setId("tsk-" + UUID.randomUUID().toString().substring(0, 8));
        req.setStudentId(auth.getName());
        if (req.getDueDate() == null) req.setDueDate(LocalDateTime.now().plusDays(2));
        return ResponseEntity.status(HttpStatus.CREATED).body(taskRepo.save(req));
    }

    @PutMapping("/{id}")
    public TaskItem update(@PathVariable String id, @RequestBody TaskItem req, Authentication auth) {
        TaskItem existing = taskRepo.findByIdAndStudentId(id, auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        if (req.getTitle() != null && !req.getTitle().isBlank()) existing.setTitle(req.getTitle().trim());
        if (req.getStatus() != null) existing.setStatus(req.getStatus());
        if (req.getPriority() != null) existing.setPriority(req.getPriority());
        existing.setProgress(Math.min(100, Math.max(0, req.getProgress())));
        if (existing.getProgress() == 100) existing.setStatus("Completed");
        existing.setUpdatedAt(Instant.now());
        return taskRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable String id, Authentication auth) {
        TaskItem existing = taskRepo.findByIdAndStudentId(id, auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found."));
        taskRepo.delete(existing);
        return Map.of("deletedId", id);
    }
}
