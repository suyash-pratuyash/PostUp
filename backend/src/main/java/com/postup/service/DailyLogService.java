package com.postup.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.postup.dto.DailyLogDto;
import com.postup.entity.DailyLog;
import com.postup.entity.Project;
import com.postup.repository.DailyLogRepository;
import com.postup.repository.GeneratedPostRepository;
import com.postup.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyLogService {

    private final DailyLogRepository dailyLogRepository;
    private final ProjectRepository projectRepository;
    private final GeneratedPostRepository generatedPostRepository;
    private final ObjectMapper objectMapper;

    public List<DailyLogDto> getAllLogs(Long projectId, int limit, int offset) {
        List<DailyLog> logs;
        PageRequest pageable = PageRequest.of(offset / Math.max(limit, 1), limit);

        if (projectId != null) {
            logs = dailyLogRepository.findByProjectIdWithProject(projectId, pageable);
        } else {
            logs = dailyLogRepository.findAllWithProject(pageable);
        }

        return logs.stream().map(this::toDto).toList();
    }

    public DailyLogDto getLog(Long id) {
        DailyLog log = dailyLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));
        return toDto(log);
    }

    @Transactional
    public DailyLogDto createLog(Long projectId, Integer dayNumber, String title, String content, List<String> tags) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content is required");
        }

        Project project = null;
        Integer finalDayNumber = dayNumber;

        if (projectId != null) {
            project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new IllegalArgumentException("Project not found"));

            if (finalDayNumber == null) {
                Integer maxDay = dailyLogRepository.findMaxDayNumberByProjectId(projectId);
                finalDayNumber = (maxDay != null ? maxDay : 0) + 1;
            }
        }

        DailyLog log = DailyLog.builder()
                .project(project)
                .dayNumber(finalDayNumber)
                .title(title.trim())
                .content(content.trim())
                .tags(tagsToJson(tags != null ? tags : Collections.emptyList()))
                .build();

        log = dailyLogRepository.save(log);

        // Update project's updated_at
        if (project != null) {
            projectRepository.save(project);
        }

        return toDto(log);
    }

    @Transactional
    public DailyLogDto updateLog(Long id, String title, String content, List<String> tags, Integer dayNumber) {
        DailyLog log = dailyLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));

        if (title != null && !title.trim().isEmpty()) {
            log.setTitle(title.trim());
        }
        if (content != null && !content.trim().isEmpty()) {
            log.setContent(content.trim());
        }
        if (tags != null) {
            log.setTags(tagsToJson(tags));
        }
        if (dayNumber != null) {
            log.setDayNumber(dayNumber);
        }

        log = dailyLogRepository.save(log);
        return toDto(log);
    }

    @Transactional
    public void deleteLog(Long id) {
        DailyLog log = dailyLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Log not found"));

        // Unlink generated posts referencing this log
        generatedPostRepository.findAll().stream()
                .filter(p -> p.getDailyLog() != null && p.getDailyLog().getId().equals(id))
                .forEach(p -> {
                    p.setDailyLog(null);
                    generatedPostRepository.save(p);
                });

        dailyLogRepository.delete(log);
    }

    public DailyLogDto toDto(DailyLog log) {
        return DailyLogDto.builder()
                .id(log.getId())
                .projectId(log.getProject() != null ? log.getProject().getId() : null)
                .dayNumber(log.getDayNumber())
                .title(log.getTitle())
                .content(log.getContent())
                .tags(parseTags(log.getTags()))
                .projectName(log.getProject() != null ? log.getProject().getName() : null)
                .createdAt(log.getCreatedAt())
                .updatedAt(log.getUpdatedAt())
                .build();
    }

    private List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(tagsJson, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    private String tagsToJson(List<String> tags) {
        try {
            return objectMapper.writeValueAsString(tags != null ? tags : Collections.emptyList());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }
}
