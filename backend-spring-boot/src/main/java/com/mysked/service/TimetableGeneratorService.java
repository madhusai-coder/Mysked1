package com.mysked.service;

import com.mysked.entity.StudySession;
import com.mysked.entity.Subject;
import com.mysked.repository.StudySessionRepository;
import com.mysked.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class TimetableGeneratorService {
    private final SubjectRepository subjectRepo;
    private final StudySessionRepository sessionRepo;

    public TimetableGeneratorService(SubjectRepository subjectRepo, StudySessionRepository sessionRepo) {
        this.subjectRepo = subjectRepo;
        this.sessionRepo = sessionRepo;
    }

    public List<StudySession> autoGenerate(String studentId) {
        List<Subject> subjects = new ArrayList<>(subjectRepo.findByStudentId(studentId));
        if (subjects.isEmpty()) {
            throw new IllegalArgumentException("Add at least one subject before generating an automatic timetable.");
        }
        subjects.sort((a, b) -> Double.compare(
                b.getWeeklyTargetHours().doubleValue() - b.getLoggedHours().doubleValue(),
                a.getWeeklyTargetHours().doubleValue() - a.getLoggedHours().doubleValue()
        ));

        List<StudySession> existing = sessionRepo.findByStudentId(studentId);
        String[] slots = {"08:30", "11:00", "15:00", "17:30", "20:00"};
        List<StudySession> created = new ArrayList<>();
        int pointer = 0;

        for (int day = 0; day < 7 && created.size() < 7; day++) {
            final int d = day;
            for (String slot : slots) {
                boolean conflict = existing.stream().anyMatch(e -> e.getDayOfWeek() == d && slot.equals(e.getStartTime()));
                if (!conflict) {
                    Subject sub = subjects.get(pointer++ % subjects.size());
                    int startHour = Integer.parseInt(slot.substring(0, 2));
                    String endTime = String.format("%02d:%s", startHour + 1, slot.substring(3));

                    StudySession session = new StudySession();
                    session.setId("ses-" + UUID.randomUUID().toString().substring(0, 8));
                    session.setStudentId(studentId);
                    session.setSubjectId(sub.getId());
                    session.setTitle("Auto-Scheduled: " + sub.getCode() + " Focused Study");
                    session.setDayOfWeek(day);
                    session.setSessionDate(LocalDate.now().plusDays(day));
                    session.setStartTime(slot);
                    session.setEndTime(endTime);
                    session.setDurationMinutes(60);
                    session.setRecurring("Weekly");
                    session.setStatus("Scheduled");
                    created.add(sessionRepo.save(session));
                    break;
                }
            }
        }
        return created;
    }
}
