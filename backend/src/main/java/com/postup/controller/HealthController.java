package com.postup.controller;

import com.postup.dto.HealthResponse;
import com.postup.repository.DailyLogRepository;
import com.postup.repository.GeneratedPostRepository;
import com.postup.repository.ProjectRepository;
import com.postup.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final ProjectRepository projectRepository;
    private final DailyLogRepository dailyLogRepository;
    private final GeneratedPostRepository generatedPostRepository;
    private final GeminiService geminiService;

    @GetMapping("/health")
    public HealthResponse health() {
        return HealthResponse.builder()
                .status("ok")
                .timestamp(Instant.now().toString())
                .stats(HealthResponse.Stats.builder()
                        .projects(projectRepository.count())
                        .dailyLogs(dailyLogRepository.count())
                        .generatedPosts(generatedPostRepository.count())
                        .build())
                .geminiConfigured(geminiService.isConfigured())
                .build();
    }
}
