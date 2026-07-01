package com.postup.service;

import com.postup.dto.GeneratedPostDto;
import com.postup.entity.DailyLog;
import com.postup.entity.GeneratedPost;
import com.postup.entity.Project;
import com.postup.repository.DailyLogRepository;
import com.postup.repository.GeneratedPostRepository;
import com.postup.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final GeneratedPostRepository postRepository;
    private final ProjectRepository projectRepository;
    private final DailyLogRepository dailyLogRepository;
    private final GeminiService geminiService;

    private static final List<String> VALID_TONES = Arrays.asList("professional", "casual", "storytelling", "motivational");

    @Transactional
    public GeneratedPostDto generatePost(String input, String tone, Long dailyLogId, Long projectId) {
        if (input == null || input.trim().isEmpty()) {
            throw new IllegalArgumentException("Input text is required");
        }

        String useTone = tone != null ? tone : "professional";
        if (!VALID_TONES.contains(useTone)) {
            throw new IllegalArgumentException("Invalid tone. Choose from: " + String.join(", ", VALID_TONES));
        }

        String generatedContent = geminiService.generateLinkedInPost(input.trim(), useTone);

        DailyLog dailyLog = dailyLogId != null ? dailyLogRepository.findById(dailyLogId).orElse(null) : null;
        Project project = projectId != null ? projectRepository.findById(projectId).orElse(null) : null;

        GeneratedPost post = GeneratedPost.builder()
                .dailyLog(dailyLog)
                .project(project)
                .rawInput(input.trim())
                .generatedContent(generatedContent)
                .tone(useTone)
                .build();

        post = postRepository.save(post);
        return toDto(post);
    }

    @Transactional
    public GeneratedPostDto regeneratePost(Long postId, String feedback, String tone) {
        if (postId == null) {
            throw new IllegalArgumentException("post_id is required");
        }
        if (feedback == null || feedback.trim().isEmpty()) {
            throw new IllegalArgumentException("Feedback is required");
        }

        GeneratedPost original = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Original post not found"));

        String useTone = tone != null ? tone : original.getTone();
        String regenerated = geminiService.regenerateWithFeedback(
                original.getGeneratedContent(), feedback.trim(), useTone);

        GeneratedPost newPost = GeneratedPost.builder()
                .dailyLog(original.getDailyLog())
                .project(original.getProject())
                .rawInput(original.getRawInput() + "\n\n[Feedback: " + feedback.trim() + "]")
                .generatedContent(regenerated)
                .tone(useTone)
                .build();

        newPost = postRepository.save(newPost);
        return toDto(newPost);
    }

    @Transactional
    public GeneratedPostDto generateProjectOverview(Long projectId, String tone) {
        if (projectId == null) {
            throw new IllegalArgumentException("project_id is required");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<DailyLog> logs = dailyLogRepository.findByProjectIdOrderByDayNumberAsc(projectId);

        if (logs.isEmpty()) {
            throw new IllegalArgumentException("Project has no daily logs. Add some logs first before generating an overview.");
        }

        String useTone = tone != null ? tone : "professional";
        String generatedContent = geminiService.generateProjectOverview(project, logs, useTone);

        String rawInput = "Project Overview: " + project.getName() + "\n" + logs.size() + " days of logs";

        GeneratedPost post = GeneratedPost.builder()
                .project(project)
                .rawInput(rawInput)
                .generatedContent(generatedContent)
                .tone(useTone)
                .build();

        post = postRepository.save(post);
        return toDto(post);
    }

    public List<GeneratedPostDto> getAllPosts(Long projectId, int limit, int offset) {
        PageRequest pageable = PageRequest.of(offset / Math.max(limit, 1), limit);

        List<GeneratedPost> posts;
        if (projectId != null) {
            posts = postRepository.findByProjectIdWithProject(projectId, pageable);
        } else {
            posts = postRepository.findAllWithProject(pageable);
        }

        return posts.stream().map(this::toDto).toList();
    }

    public GeneratedPostDto getPost(Long id) {
        GeneratedPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return toDto(post);
    }

    @Transactional
    public GeneratedPostDto toggleFavorite(Long id) {
        GeneratedPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setIsFavorite(!post.getIsFavorite());
        post = postRepository.save(post);
        return toDto(post);
    }

    @Transactional
    public void deletePost(Long id) {
        GeneratedPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        postRepository.delete(post);
    }

    public GeneratedPostDto toDto(GeneratedPost post) {
        return GeneratedPostDto.builder()
                .id(post.getId())
                .dailyLogId(post.getDailyLog() != null ? post.getDailyLog().getId() : null)
                .projectId(post.getProject() != null ? post.getProject().getId() : null)
                .rawInput(post.getRawInput())
                .generatedContent(post.getGeneratedContent())
                .tone(post.getTone())
                .isFavorite(post.getIsFavorite())
                .projectName(post.getProject() != null ? post.getProject().getName() : null)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
