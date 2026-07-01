package com.postup.service;

import com.postup.dto.ProjectDto;
import com.postup.entity.Project;
import com.postup.repository.DailyLogRepository;
import com.postup.repository.GeneratedPostRepository;
import com.postup.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final DailyLogRepository dailyLogRepository;
    private final GeneratedPostRepository generatedPostRepository;
    private final DailyLogService dailyLogService;
    private final PostService postService;

    public List<ProjectDto> getAllProjects() {
        List<Project> projects = projectRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));

        return projects.stream().map(p -> {
            long logCount = dailyLogRepository.countByProjectId(p.getId());
            Integer latestDay = dailyLogRepository.findMaxDayNumberByProjectId(p.getId());

            return ProjectDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .description(p.getDescription())
                    .status(p.getStatus())
                    .createdAt(p.getCreatedAt())
                    .updatedAt(p.getUpdatedAt())
                    .logCount(logCount)
                    .latestDay(latestDay)
                    .build();
        }).toList();
    }

    public ProjectDto getProjectDetail(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        var logs = dailyLogRepository.findByProjectIdOrderByDayNumberAsc(id)
                .stream().map(dailyLogService::toDto).toList();

        var posts = generatedPostRepository.findByProjectIdOrderByCreatedAtDesc(id)
                .stream().map(postService::toDto).toList();

        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .logs(logs)
                .posts(posts)
                .build();
    }

    @Transactional
    public ProjectDto createProject(String name, String description) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Project name is required");
        }

        Project project = Project.builder()
                .name(name.trim())
                .description(description != null ? description.trim() : "")
                .build();

        project = projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public ProjectDto updateProject(Long id, String name, String description, String status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (name != null && !name.trim().isEmpty()) {
            project.setName(name.trim());
        }
        if (description != null) {
            project.setDescription(description.trim());
        }
        if (status != null) {
            project.setStatus(status);
        }

        project = projectRepository.save(project);
        return toDto(project);
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Unlink daily logs (set project_id = null)
        dailyLogRepository.findByProjectIdOrderByDayNumberAsc(id).forEach(log -> {
            log.setProject(null);
            dailyLogRepository.save(log);
        });

        // Unlink generated posts (set project_id = null)
        generatedPostRepository.findByProjectIdOrderByCreatedAtDesc(id).forEach(post -> {
            post.setProject(null);
            generatedPostRepository.save(post);
        });

        projectRepository.delete(project);
    }

    private ProjectDto toDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
