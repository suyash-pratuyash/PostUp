package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthResponse {
    private String status;
    private String timestamp;
    private Stats stats;

    @JsonProperty("gemini_configured")
    private boolean geminiConfigured;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Stats {
        private long projects;

        @JsonProperty("daily_logs")
        private long dailyLogs;

        @JsonProperty("generated_posts")
        private long generatedPosts;
    }
}
