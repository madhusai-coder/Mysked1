package com.mysked.service;

import com.mysked.entity.Subject;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VoiceTaskParserService {
    public record ParsedTask(
            String title,
            String category,
            String priority,
            LocalDateTime dueDate,
            String subjectId,
            int estimatedMinutes) {}

    public ParsedTask parse(String transcript, List<Subject> subjects) {
        String raw = transcript.trim();
        String lower = raw.toLowerCase(Locale.ROOT);

        String priority = "Medium";
        if (lower.matches(".*\\b(urgent|asap|critical|immediately)\\b.*")) priority = "Urgent";
        else if (lower.matches(".*\\b(high|important|priority)\\b.*")) priority = "High";
        else if (lower.matches(".*\\b(low|whenever|minor)\\b.*")) priority = "Low";

        String category = "Assignment";
        if (lower.matches(".*\\b(homework|hw|sheet|exercise|problem set)\\b.*")) category = "Homework";
        else if (lower.matches(".*\\b(project|build|presentation|capstone)\\b.*")) category = "Project";
        else if (lower.matches(".*\\b(revise|revision|review|study|exam|quiz)\\b.*")) category = "Revision";

        int dueOffset = 2;
        if (lower.contains("today") || lower.contains("tonight")) dueOffset = 0;
        else if (lower.contains("tomorrow")) dueOffset = 1;
        else if (lower.contains("next week")) dueOffset = 7;

        int estimatedMinutes = 60;
        Matcher minMatcher = Pattern.compile("(\\d+)\\s*(min|minute|minutes)").matcher(lower);
        Matcher hrMatcher = Pattern.compile("(\\d+)\\s*(hr|hrs|hour|hours)").matcher(lower);
        if (minMatcher.find()) {
            estimatedMinutes = Math.min(480, Math.max(15, Integer.parseInt(minMatcher.group(1))));
        } else if (hrMatcher.find()) {
            estimatedMinutes = Math.min(480, Math.max(30, Integer.parseInt(hrMatcher.group(1)) * 60));
        }

        String matchedSubjectId = null;
        for (Subject s : subjects) {
            if (lower.contains(s.getCode().toLowerCase(Locale.ROOT)) ||
                lower.contains(s.getName().toLowerCase(Locale.ROOT))) {
                matchedSubjectId = s.getId();
                break;
            }
        }

        String cleaned = raw.replaceAll("(?i)^(remind me to|add task|create task|i need to|schedule)\\s+", "")
                .replaceAll("(?i)\\b(high priority|low priority|medium priority|urgent|asap)\\b", "")
                .replaceAll("(?i)\\b(due today|due tomorrow|today|tomorrow|next week)\\b", "")
                .replaceAll("\\s{2,}", " ")
                .trim();

        String title = cleaned.isEmpty() ? raw : Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
        return new ParsedTask(title, category, priority, LocalDateTime.now().plusDays(dueOffset), matchedSubjectId, estimatedMinutes);
    }
}
