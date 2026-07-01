package com.postup.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedPostDto {
    private Long id;

    @JsonProperty("daily_log_id")
    private Long dailyLogId;

    @JsonProperty("project_id")
    private Long projectId;

    @JsonProperty("raw_input")
    private String rawInput;

    @JsonProperty("generated_content")
    private String generatedContent;

    private String tone;

    @JsonProperty("is_favorite")
    private Boolean isFavorite;

    @JsonProperty("project_name")
    private String projectName;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}
